import { initializeStripe } from './stripe-config';

let isStripeInitialized = false;

export const ensureStripeInitialized = async () => {
  if (isStripeInitialized) {
    return;
  }

  try {
    await initializeStripe();
    isStripeInitialized = true;
    console.log('Stripe initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    // Don't throw, allow app to continue without Stripe
  }
};

export const isStripeReady = () => isStripeInitialized;