import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { 
  useStripe, 
  useApplePay, 
  useGooglePay,
  CreatePaymentMethodResult,
  ConfirmPaymentResult,
  ApplePay,
  GooglePay
} from '@stripe/stripe-react-native';
import { PaymentIntentResponse } from '@/lib/stripe-service';
import { Quote } from '@/types/service';

export interface PaymentHookParams {
  quote: Quote;
  paymentType: 'deposit' | 'full' | 'completion';
  customerId?: string;
  onSuccess: (result: ConfirmPaymentResult) => void;
  onError: (error: string) => void;
}

export interface PaymentState {
  isProcessing: boolean;
  paymentIntent: PaymentIntentResponse | null;
  error: string | null;
}

export const useStripePayment = ({
  quote,
  paymentType,
  customerId,
  onSuccess,
  onError,
}: PaymentHookParams) => {
  const { confirmPayment, createPaymentMethod } = useStripe();
  const { presentApplePay, confirmApplePayPayment } = useApplePay();
  const { initGooglePay, presentGooglePay } = useGooglePay();

  const [state, setState] = useState<PaymentState>({
    isProcessing: false,
    paymentIntent: null,
    error: null,
  });

  // Calculate payment amount based on type
  const getPaymentAmount = useCallback(() => {
    if (paymentType === 'deposit') {
      return Math.round(quote.totalCost * 0.3); // 30% deposit
    } else if (paymentType === 'completion') {
      // Include additional parts if any
      return quote.totalCost + (quote.partsCost || 0);
    }
    return quote.totalCost;
  }, [quote, paymentType]);

  // Initialize payment intent
  const initializePayment = useCallback(async (): Promise<PaymentIntentResponse> => {
    try {
      setState(prev => ({ ...prev, isProcessing: true, error: null }));

      const amount = getPaymentAmount();
      
      // For now, simulate the payment intent creation
      // In a real app, this would call the backend API
      const paymentIntent: PaymentIntentResponse = {
        clientSecret: `pi_${Math.random().toString(36).substr(2, 9)}_secret_${Math.random().toString(36).substr(2, 9)}`,
        paymentIntentId: `pi_${Math.random().toString(36).substr(2, 9)}`,
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
      };

      setState(prev => ({ 
        ...prev, 
        paymentIntent,
        isProcessing: false 
      }));

      return paymentIntent;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize payment';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isProcessing: false 
      }));
      throw error;
    }
  }, [quote, paymentType, customerId, getPaymentAmount]);

  // Process card payment
  const processCardPayment = useCallback(async (
    paymentMethodId?: string
  ): Promise<ConfirmPaymentResult> => {
    try {
      setState(prev => ({ ...prev, isProcessing: true, error: null }));

      let paymentIntent = state.paymentIntent;
      if (!paymentIntent) {
        paymentIntent = await initializePayment();
      }

      let paymentMethod: CreatePaymentMethodResult;
      
      if (paymentMethodId) {
        // Use existing payment method
        paymentMethod = { paymentMethod: { id: paymentMethodId } } as CreatePaymentMethodResult;
      } else {
        // Create new payment method
        paymentMethod = await createPaymentMethod({
          paymentMethodType: 'Card',
        });
      }

      if (paymentMethod.error) {
        throw new Error(paymentMethod.error.message);
      }

      // Confirm payment
      const result = await confirmPayment(paymentIntent.clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: paymentMethod.paymentMethod
          ? { paymentMethodId: paymentMethod.paymentMethod.id }
          : undefined,
      });

      setState(prev => ({ ...prev, isProcessing: false }));

      if (result.error) {
        throw new Error(result.error.message);
      }

      onSuccess(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isProcessing: false 
      }));
      onError(errorMessage);
      throw error;
    }
  }, [state.paymentIntent, initializePayment, createPaymentMethod, confirmPayment, onSuccess, onError]);

  // Process Apple Pay payment
  const processApplePayPayment = useCallback(async (): Promise<ConfirmPaymentResult> => {
    try {
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Pay is only available on iOS');
      }

      setState(prev => ({ ...prev, isProcessing: true, error: null }));

      let paymentIntent = state.paymentIntent;
      if (!paymentIntent) {
        paymentIntent = await initializePayment();
      }

      const amount = getPaymentAmount();

      // Present Apple Pay
      const { error: applePayError } = await presentApplePay({
        cartItems: [{
          label: quote.description,
          amount: amount.toString(),
          paymentType: 'final',
        }],
        country: 'US',
        currency: 'USD',
        shippingMethods: [],
        requiredShippingAddressFields: [],
        requiredBillingContactFields: ['emailAddress'],
      });

      if (applePayError) {
        throw new Error(applePayError.message);
      }

      // Confirm Apple Pay payment
      const result = await confirmApplePayPayment(paymentIntent.clientSecret);

      setState(prev => ({ ...prev, isProcessing: false }));

      if (result.error) {
        throw new Error(result.error.message);
      }

      onSuccess(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Apple Pay failed';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isProcessing: false 
      }));
      onError(errorMessage);
      throw error;
    }
  }, [state.paymentIntent, initializePayment, getPaymentAmount, quote, presentApplePay, confirmApplePayPayment, onSuccess, onError]);

  // Process Google Pay payment
  const processGooglePayPayment = useCallback(async (): Promise<ConfirmPaymentResult> => {
    try {
      if (Platform.OS !== 'android') {
        throw new Error('Google Pay is only available on Android');
      }

      setState(prev => ({ ...prev, isProcessing: true, error: null }));

      // Initialize Google Pay
      const { error: initError } = await initGooglePay({
        testEnvironment: process.env.NODE_ENV !== 'production',
        merchantName: 'Heinicus Mobile Mechanic',
        countryCode: 'US',
        billingAddressConfig: {
          format: 'MIN',
          isRequired: false,
        },
      });

      if (initError) {
        throw new Error(initError.message);
      }

      let paymentIntent = state.paymentIntent;
      if (!paymentIntent) {
        paymentIntent = await initializePayment();
      }

      const amount = getPaymentAmount();

      // Present Google Pay
      const { error: googlePayError } = await presentGooglePay({
        clientSecret: paymentIntent.clientSecret,
        forSetupIntent: false,
        currencyCode: 'USD',
      });

      if (googlePayError) {
        throw new Error(googlePayError.message);
      }

      setState(prev => ({ ...prev, isProcessing: false }));

      // Note: Google Pay automatically confirms the payment
      const result: ConfirmPaymentResult = {
        paymentIntent: {
          id: paymentIntent.paymentIntentId,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: 'succeeded',
        },
      };

      onSuccess(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google Pay failed';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isProcessing: false 
      }));
      onError(errorMessage);
      throw error;
    }
  }, [state.paymentIntent, initializePayment, getPaymentAmount, initGooglePay, presentGooglePay, onSuccess, onError]);

  // Reset payment state
  const resetPayment = useCallback(() => {
    setState({
      isProcessing: false,
      paymentIntent: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    initializePayment,
    processCardPayment,
    processApplePayPayment,
    processGooglePayPayment,
    resetPayment,
    paymentAmount: getPaymentAmount(),
  };
};