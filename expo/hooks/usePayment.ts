import { useState } from 'react';
import { useStripe } from '@stripe/stripe-react-native';
import { trpcClient } from '@/lib/trpc';

export function usePayment(jobId: string, customerId: string) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [isProcessing, setIsProcessing] = useState(false);

  const processPayment = async (amount: number) => {
    setIsProcessing(true);
    try {
      const result = await trpcClient.payment.createPaymentIntent.mutate({ jobId, customerId, amount });
      if (!result.success) return { success: false, error: result.error };

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Heinicus Mobile Mechanic',
        paymentIntentClientSecret: result.clientSecret!,
      });

      if (initError) return { success: false, error: initError.message };

      const { error: presentError } = await presentPaymentSheet();
      if (presentError) return { success: false, error: presentError.message };

      return { success: true };
    } finally {
      setIsProcessing(false);
    }
  };

  return { processPayment, isProcessing };
}
