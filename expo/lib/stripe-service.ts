import { stripe, handleStripeError } from './stripe-config';
import { Quote } from '@/types/service';

export interface CreatePaymentIntentParams {
  amount: number; // in cents
  currency: string;
  customerId?: string;
  quoteId: string;
  paymentType: 'deposit' | 'full' | 'completion';
  metadata?: Record<string, string>;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

// Create payment intent for processing payments
export const createPaymentIntent = async (
  params: CreatePaymentIntentParams
): Promise<PaymentIntentResponse> => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100), // Convert to cents
      currency: params.currency.toLowerCase(),
      customer: params.customerId,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        quoteId: params.quoteId,
        paymentType: params.paymentType,
        ...params.metadata,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    };
  } catch (error) {
    const stripeError = handleStripeError(error);
    throw new Error(stripeError.message);
  }
};

// Create Stripe customer
export const createStripeCustomer = async (
  email: string,
  name: string,
  metadata?: Record<string, string>
) => {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata,
    });

    return customer;
  } catch (error) {
    const stripeError = handleStripeError(error);
    throw new Error(stripeError.message);
  }
};

// Retrieve payment intent
export const retrievePaymentIntent = async (paymentIntentId: string) => {
  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    const stripeError = handleStripeError(error);
    throw new Error(stripeError.message);
  }
};

// Confirm payment intent (for server-side confirmation)
export const confirmPaymentIntent = async (
  paymentIntentId: string,
  paymentMethodId: string
) => {
  try {
    return await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });
  } catch (error) {
    const stripeError = handleStripeError(error);
    throw new Error(stripeError.message);
  }
};

// Cancel payment intent
export const cancelPaymentIntent = async (paymentIntentId: string) => {
  try {
    return await stripe.paymentIntents.cancel(paymentIntentId);
  } catch (error) {
    const stripeError = handleStripeError(error);
    throw new Error(stripeError.message);
  }
};

// Create refund
export const createRefund = async (
  paymentIntentId: string,
  amount?: number,
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
) => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount,
      reason,
    });

    return refund;
  } catch (error) {
    const stripeError = handleStripeError(error);
    throw new Error(stripeError.message);
  }
};

// Utility function to calculate Stripe fees
export const calculateStripeFees = (amount: number): number => {
  // Stripe standard rate: 2.9% + 30¢ per transaction
  const percentageFee = amount * 0.029;
  const fixedFee = 0.30;
  return Math.round((percentageFee + fixedFee) * 100) / 100;
};

// Validate payment amount
export const validatePaymentAmount = (amount: number): boolean => {
  // Stripe minimum charge amount is $0.50 USD
  return amount >= 0.50;
};

// Format amount for Stripe (convert to cents)
export const formatStripeAmount = (amount: number): number => {
  return Math.round(amount * 100);
};

// Format amount from Stripe (convert from cents)
export const formatFromStripeAmount = (amount: number): number => {
  return Math.round(amount) / 100;
};

// Get payment method types based on quote and platform
export const getPaymentMethodTypes = (quote: Quote, platform: string): string[] => {
  const baseTypes = ['card'];
  
  if (platform === 'ios' && quote.totalCost >= 1) {
    baseTypes.push('apple_pay');
  }
  
  if (platform === 'android' && quote.totalCost >= 1) {
    baseTypes.push('google_pay');
  }
  
  return baseTypes;
};