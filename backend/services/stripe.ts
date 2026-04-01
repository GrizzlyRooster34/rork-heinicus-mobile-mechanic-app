import Stripe from 'stripe';
import { PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2026-03-25.dahlia' })
  : null;

const assertStripeClient = () => {
  if (!stripe) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  return stripe;
};

const mapPaymentIntentStatus = (status: Stripe.PaymentIntent.Status): PaymentStatus => {
  switch (status) {
    case 'succeeded':
      return PaymentStatus.SUCCEEDED;
    case 'processing':
      return PaymentStatus.PROCESSING;
    case 'canceled':
      return PaymentStatus.CANCELLED;
    case 'requires_capture':
    case 'requires_action':
    case 'requires_confirmation':
    case 'requires_payment_method':
      return PaymentStatus.PENDING;
    default:
      return PaymentStatus.FAILED;
  }
};

export async function createPaymentIntent(input: {
  jobId: string;
  customerId: string;
  amount: number;
  quoteId?: string;
}) {
  const stripeClient = assertStripeClient();

  const amountInCents = Math.round(input.amount * 100);
  if (amountInCents <= 0) {
    throw new Error('Amount must be greater than zero');
  }

  const paymentIntent = await stripeClient.paymentIntents.create({
    amount: amountInCents,
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    metadata: {
      jobId: input.jobId,
      customerId: input.customerId,
      ...(input.quoteId ? { quoteId: input.quoteId } : {}),
    },
  });

  const payment = await prisma.payment.create({
    data: {
      jobId: input.jobId,
      customerId: input.customerId,
      quoteId: input.quoteId,
      stripePaymentId: paymentIntent.id,
      amount: input.amount,
      currency: 'USD',
      status: mapPaymentIntentStatus(paymentIntent.status),
    },
  });

  return {
    success: true,
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    payment,
  };
}

export async function getJobPayments(jobId: string) {
  return prisma.payment.findMany({
    where: { jobId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function syncPaymentStatus(paymentIntentId: string) {
  const stripeClient = assertStripeClient();
  const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);

  const payment = await prisma.payment.update({
    where: { stripePaymentId: paymentIntent.id },
    data: {
      status: mapPaymentIntentStatus(paymentIntent.status),
    },
  });

  return {
    success: true,
    paymentIntentId: paymentIntent.id,
    status: payment.status,
    payment,
  };
}
