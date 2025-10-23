import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useStripe, PaymentSheetError } from '@stripe/stripe-react-native';
import { Quote } from '@/types/service';

// This function would live in a service file that communicates with your backend
async function fetchPaymentSheetParams(quote: Quote, paymentType: 'deposit' | 'full' | 'completion') {
  const getPaymentAmount = () => {
    if (paymentType === 'deposit') {
      return Math.round(quote.totalCost * 0.3); // 30% deposit
    }
    // In a real app, you might have different logic for completion
    return quote.totalCost;
  };

  const amount = getPaymentAmount();

  // In a real app, you would make a fetch request to your backend API
  // const response = await fetch(`YOUR_BACKEND_URL/payment-sheet`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({ amount: amount * 100 }), // amount in cents
  // });
  // const { paymentIntent, ephemeralKey, customer } = await response.json();
  // return { paymentIntent, ephemeralKey, customer };

  // For demonstration purposes, we'll simulate the backend response.
  // NOTE: This is not secure and should be replaced with a real backend call.
  console.warn('Simulating backend response for payment sheet. This is not secure!');
  return {
    paymentIntent: `pi_${Math.random().toString(36).substr(2)}_secret_${Math.random().toString(36).substr(2)}`,
    ephemeralKey: `ek_test_${Math.random().toString(36).substr(2)}`,
    customer: `cus_${Math.random().toString(36).substr(2)}`,
    publishableKey: 'YOUR_STRIPE_PUBLISHABLE_KEY', // This should also come from the backend or config
  };
}

interface UseStripePaymentOptions {
  quote: Quote;
  paymentType: 'deposit' | 'full' | 'completion';
  onSuccess: (result: any) => void;
  onError: (error: string) => void;
}

export const useStripePayment = ({ quote, paymentType, onSuccess, onError }: UseStripePaymentOptions) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [isProcessing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate payment amount based on type
  const paymentAmount = (() => {
    if (paymentType === 'deposit') {
      return Math.round(quote.totalCost * 0.3); // 30% deposit
    }
    return quote.totalCost;
  })();

  const initializePaymentSheet = useCallback(async () => {
    setProcessing(true);
    setError(null);

    try {
      const { paymentIntent, ephemeralKey, customer } = await fetchPaymentSheetParams(quote, paymentType);

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Heinicus Mobile Mechanic',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: true,
        googlePay: {
          merchantCountryCode: 'US',
          testEnv: process.env.NODE_ENV !== 'production',
          currencyCode: 'usd',
        },
        applePay: {
          merchantCountryCode: 'US',
        },
      });

      if (initError) {
        console.error('Stripe initPaymentSheet error:', initError);
        setError(initError.message);
        onError(initError.message);
        return false;
      }
      return true;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to initialize payment sheet';
      console.error(errorMessage, e);
      setError(errorMessage);
      onError(errorMessage);
      return false;
    } finally {
      setProcessing(false);
    }
  }, [initPaymentSheet, quote, paymentType, onError]);

  const openPaymentSheet = useCallback(async () => {
    const initialized = await initializePaymentSheet();
    if (!initialized) {
      return null;
    }

    setProcessing(true);
    const { error: presentError } = await presentPaymentSheet();
    setProcessing(false);

    if (presentError) {
      if (presentError.code !== PaymentSheetError.Canceled) {
        console.error('Stripe presentPaymentSheet error:', presentError);
        setError(presentError.message);
        onError(presentError.message);
      }
      return null;
    }

    // Payment succeeded
    const result = { success: true, paymentIntent: { id: 'simulated' } };
    onSuccess(result);
    return result;
  }, [initializePaymentSheet, presentPaymentSheet, onSuccess, onError]);

  const processCardPayment = useCallback(async () => {
    return await openPaymentSheet();
  }, [openPaymentSheet]);

  const processApplePayPayment = useCallback(async () => {
    return await openPaymentSheet();
  }, [openPaymentSheet]);

  const processGooglePayPayment = useCallback(async () => {
    return await openPaymentSheet();
  }, [openPaymentSheet]);

  return {
    isProcessing,
    error,
    paymentAmount,
    openPaymentSheet,
    processCardPayment,
    processApplePayPayment,
    processGooglePayPayment,
  };
};
