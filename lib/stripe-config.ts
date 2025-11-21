import { Platform } from 'react-native';
import { StripeProvider, initStripe } from '@stripe/stripe-react-native';
import Stripe from 'stripe';

// Client-side Stripe configuration
export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

// Server-side Stripe configuration (for backend)
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Initialize Stripe for React Native
export const initializeStripe = async () => {
  if (!STRIPE_PUBLISHABLE_KEY) {
    console.warn('Stripe publishable key not found');
    return;
  }

  try {
    await initStripe({
      publishableKey: STRIPE_PUBLISHABLE_KEY,
      merchantIdentifier: 'merchant.com.heinicus.mobilemechanic', // iOS Apple Pay
      urlScheme: 'heinicus-mobile-mechanic', // Deep linking
    });
    console.log('Stripe initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
  }
};

// Server-side Stripe instance
export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover', // Use latest API version
  typescript: true,
});

// Stripe configuration for different environments
export const getStripeConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    publishableKey: STRIPE_PUBLISHABLE_KEY,
    isTestMode: !isProduction,
    currency: 'usd',
    supportedPaymentMethods: [
      'card',
      ...(Platform.OS === 'ios' ? ['apple_pay'] : []),
      ...(Platform.OS === 'android' ? ['google_pay'] : []),
    ],
  };
};

// Payment method configurations
export const PAYMENT_METHOD_CONFIG = {
  card: {
    allowRedisplay: 'always' as const,
    setupFutureUsage: 'off_session' as const,
  },
  apple_pay: {
    merchantIdentifier: 'merchant.com.heinicus.mobilemechanic',
    merchantCountryCode: 'US',
    requestPayerName: true,
    requestPayerEmail: true,
    requestPayerPhone: true,
    requestShipping: false,
  },
  google_pay: {
    merchantIdentifier: 'merchant.com.heinicus.mobilemechanic',
    merchantCountryCode: 'US',
    merchantName: 'Heinicus Mobile Mechanic',
    testEnvironment: !process.env.NODE_ENV || process.env.NODE_ENV !== 'production',
  },
};

// Error handling utilities
export const handleStripeError = (error: any) => {
  console.error('Stripe error:', error);
  
  if (error.type === 'card_error') {
    return {
      type: 'payment_failed',
      message: error.message || 'Your card was declined. Please try a different payment method.',
    };
  } else if (error.type === 'validation_error') {
    return {
      type: 'validation_error',
      message: 'Please check your payment information and try again.',
    };
  } else if (error.type === 'authentication_error') {
    return {
      type: 'auth_error',
      message: 'Payment authentication failed. Please contact support.',
    };
  } else {
    return {
      type: 'unknown_error',
      message: 'An unexpected error occurred. Please try again or contact support.',
    };
  }
};