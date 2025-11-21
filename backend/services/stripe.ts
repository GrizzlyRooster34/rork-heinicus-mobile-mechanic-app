import Stripe from 'stripe';
import { prisma } from '../../lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-11-20.acacia' });

export async function createPaymentIntent(jobId: string, customerId: string, amount: number) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: { jobId, customerId },
    });

    const payment = await prisma.payment.create({
      data: { jobId, customerId, stripePaymentId: paymentIntent.id, amount, status: 'PENDING' },
    });

    return { success: true, clientSecret: paymentIntent.client_secret, payment };
  } catch (error) {
    console.error('Payment intent error:', error);
    return { success: false, error: 'Failed to create payment' };
  }
}

export async function confirmPayment(paymentIntentId: string) {
  const payment = await prisma.payment.findUnique({ where: { stripePaymentId: paymentIntentId } });
  if (!payment) return;

  await prisma.payment.update({
    where: { stripePaymentId: paymentIntentId },
    data: { status: 'SUCCEEDED' },
  });
}

export async function getJobPayments(jobId: string) {
  return await prisma.payment.findMany({ where: { jobId }, orderBy: { createdAt: 'desc' } });
}
