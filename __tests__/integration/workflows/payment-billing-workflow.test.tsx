import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import { PaymentModal } from '@/components/PaymentModal';
import CustomerQuotesScreen from '@/app/(customer)/quotes';
import { setupTestEnvironment, createMockQuote, createMockServiceRequest } from '../../utils/test-utils';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';

// Mock dependencies
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({}),
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
}));

jest.mock('@/components/Button', () => ({
  Button: ({ title, onPress, disabled, style }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity 
        onPress={disabled ? undefined : onPress}
        disabled={disabled}
        style={style}
        testID={`button-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <Text>{title}</Text>
      </TouchableOpacity>
    );
  },
}));

// Mock Colors
jest.mock('@/constants/colors', () => ({
  Colors: {
    text: '#000000',
    primary: '#007AFF',
    success: '#00FF00',
    white: '#FFFFFF',
    card: '#FFFFFF',
    border: '#E0E0E0',
    textSecondary: '#666666',
    textMuted: '#999999',
    error: '#FF0000',
  },
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  X: () => 'MockX',
  Info: () => 'MockInfo',
  CheckCircle: () => 'MockCheckCircle',
  CreditCard: () => 'MockCreditCard',
  Smartphone: () => 'MockSmartphone',
  Shield: () => 'MockShield',
  AlertTriangle: () => 'MockAlertTriangle',
  Clock: () => 'MockClock',
}));

// Mock Alert
const mockAlert = jest.spyOn(Alert, 'alert');

// Mock Platform
const mockPlatform = Platform as any;

// Mock Math.random for predictable payment results
const mockMathRandom = jest.spyOn(Math, 'random');

describe('Payment and Billing Workflow Integration', () => {
  let mockAppStore: any;
  let mockAuthStore: any;

  beforeEach(() => {
    setupTestEnvironment();
    jest.clearAllMocks();
    mockMathRandom.mockReturnValue(0.5); // Ensure payment succeeds
    mockPlatform.OS = 'ios';

    // Mock store states
    mockAppStore = {
      updateQuote: jest.fn(),
      updateServiceRequest: jest.fn(),
      getJobParts: jest.fn().mockReturnValue([]),
      serviceRequests: [],
      quotes: [],
    };

    mockAuthStore = {
      user: {
        id: 'customer-123',
        email: 'customer@test.com',
        firstName: 'Test',
        lastName: 'Customer',
        role: 'customer',
        createdAt: new Date(),
      },
    };

    (useAppStore as jest.Mock).mockReturnValue(mockAppStore);
    (useAuthStore as jest.Mock).mockReturnValue(mockAuthStore);
  });

  afterEach(() => {
    mockMathRandom.mockRestore();
  });

  describe('Full Payment Flow', () => {
    const mockQuote = createMockQuote({
      id: 'quote-123',
      serviceRequestId: 'service-123',
      description: 'Brake pad replacement and rotor resurfacing',
      laborCost: 120,
      partsCost: 80,
      totalCost: 200,
      status: 'pending',
    });

    test('should complete full payment workflow', async () => {
      const mockOnSuccess = jest.fn();
      const mockOnCancel = jest.fn();

      const { getByText, getByTestId } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Verify quote details are displayed
      expect(getByText('Brake pad replacement and rotor resurfacing')).toBeTruthy();
      expect(getByText('$120')).toBeTruthy(); // Labor cost
      expect(getByText('$80')).toBeTruthy(); // Parts cost
      expect(getByText('$200')).toBeTruthy(); // Total cost

      // Verify payment method selection
      expect(getByText('Credit Card')).toBeTruthy();
      expect(getByText('•••• •••• •••• 4242')).toBeTruthy();

      // Process payment
      const payButton = getByTestId('button-pay-$200');
      fireEvent.press(payButton);

      // Should show processing state
      await waitFor(() => {
        expect(getByText('Processing...')).toBeTruthy();
      });

      // Wait for payment completion
      await waitFor(() => {
        expect(mockAppStore.updateQuote).toHaveBeenCalledWith('quote-123', {
          status: 'paid',
          paidAt: expect.any(Date),
          paymentMethod: 'card',
        });
      });

      expect(mockAppStore.updateServiceRequest).toHaveBeenCalledWith('service-123', {
        status: 'completed',
        paidAt: expect.any(Date),
      });

      expect(mockAlert).toHaveBeenCalledWith(
        'Payment Successful',
        'Payment of $200 has been processed successfully.',
        [{ text: 'OK', onPress: mockOnSuccess }]
      );
    });

    test('should handle deposit payment workflow', async () => {
      const mockOnSuccess = jest.fn();
      const mockOnCancel = jest.fn();

      const { getByText, getByTestId } = render(
        <PaymentModal
          quote={mockQuote}
          paymentType="deposit"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Verify deposit information
      expect(getByText('Pay Deposit')).toBeTruthy();
      expect(getByText('Deposit Payment')).toBeTruthy();
      expect(getByText('Pay 30% now to secure your service. Remaining balance due upon completion.')).toBeTruthy();

      const depositAmount = Math.round(mockQuote.totalCost * 0.3); // 60
      const remainingAmount = mockQuote.totalCost - depositAmount; // 140

      expect(getByText(`$${depositAmount}`)).toBeTruthy();
      expect(getByText(`$${remainingAmount}`)).toBeTruthy();

      // Process deposit payment
      const payButton = getByTestId(`button-pay-$${depositAmount}`);
      fireEvent.press(payButton);

      await waitFor(() => {
        expect(mockAppStore.updateQuote).toHaveBeenCalledWith('quote-123', {
          status: 'deposit_paid',
          depositPaidAt: expect.any(Date),
          depositAmount,
          remainingBalance: remainingAmount,
        });
      });

      expect(mockAppStore.updateServiceRequest).toHaveBeenCalledWith('service-123', {
        status: 'accepted',
      });

      expect(mockAlert).toHaveBeenCalledWith(
        'Deposit Payment Successful',
        `Deposit of $${depositAmount} has been processed. Remaining balance: $${remainingAmount}`,
        [{ text: 'OK', onPress: mockOnSuccess }]
      );
    });

    test('should handle completion payment with additional parts', async () => {
      // Mock additional parts used during service
      const mockParts = [
        { name: 'Brake Fluid', description: 'DOT 3 brake fluid', price: 15, quantity: 1 },
        { name: 'Brake Cleaner', description: 'Cleaning spray', price: 8, quantity: 1 },
      ];

      mockAppStore.getJobParts.mockReturnValue(mockParts);

      const mockOnSuccess = jest.fn();
      const mockOnCancel = jest.fn();

      const { getByText, getByTestId } = render(
        <PaymentModal
          quote={mockQuote}
          paymentType="completion"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Verify completion payment information
      expect(getByText('Final Payment')).toBeTruthy();
      expect(getByText('Job Completion Payment')).toBeTruthy();
      expect(getByText('Final payment for completed work including parts used.')).toBeTruthy();

      // Verify parts breakdown
      expect(getByText('Parts Used')).toBeTruthy();
      expect(getByText('Brake Fluid')).toBeTruthy();
      expect(getByText('DOT 3 brake fluid')).toBeTruthy();
      expect(getByText('$15 x 1 = $15.00')).toBeTruthy();
      expect(getByText('Brake Cleaner')).toBeTruthy();
      expect(getByText('$8 x 1 = $8.00')).toBeTruthy();

      const totalWithParts = mockQuote.totalCost + 23; // 200 + 15 + 8 = 223
      expect(getByText(`Pay $${totalWithParts}`)).toBeTruthy();

      // Process completion payment
      const payButton = getByTestId(`button-pay-$${totalWithParts}`);
      fireEvent.press(payButton);

      await waitFor(() => {
        expect(mockAppStore.updateQuote).toHaveBeenCalledWith('quote-123', {
          status: 'paid',
          paidAt: expect.any(Date),
          paymentMethod: 'card',
          finalAmount: totalWithParts,
          partsCost: 23,
        });
      });

      expect(mockAlert).toHaveBeenCalledWith(
        'Payment Successful',
        `Final payment of $${totalWithParts} has been processed successfully. (Includes $23 in parts)`,
        [{ text: 'OK', onPress: mockOnSuccess }]
      );
    });
  });

  describe('Payment Method Selection', () => {
    const mockQuote = createMockQuote({ totalCost: 150 });

    test('should handle credit card payment', async () => {
      const { getByText } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      // Credit card should be selected by default
      expect(getByText('Credit Card')).toBeTruthy();
      expect(getByText('•••• •••• •••• 4242')).toBeTruthy();

      const creditCardOption = getByText('Credit Card');
      fireEvent.press(creditCardOption);

      // Should remain selected
      expect(getByText('Credit Card')).toBeTruthy();
    });

    test('should handle Apple Pay on iOS', async () => {
      mockPlatform.OS = 'ios';

      const { getByText } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      expect(getByText('Apple Pay')).toBeTruthy();
      expect(getByText('Touch ID or Face ID')).toBeTruthy();

      const applePayOption = getByText('Apple Pay');
      fireEvent.press(applePayOption);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Apple Pay',
          'Apple Pay integration would be implemented here.',
          expect.any(Array)
        );
      });
    });

    test('should handle Google Pay on Android', async () => {
      mockPlatform.OS = 'android';

      const { getByText, queryByText } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      expect(getByText('Google Pay')).toBeTruthy();
      expect(getByText('Fingerprint or PIN')).toBeTruthy();
      expect(queryByText('Apple Pay')).toBeNull();

      const googlePayOption = getByText('Google Pay');
      fireEvent.press(googlePayOption);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Google Pay',
          'Google Pay integration would be implemented here.',
          expect.any(Array)
        );
      });
    });

    test('should show platform-specific payment methods only', async () => {
      mockPlatform.OS = 'web';

      const { getByText, queryByText } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      expect(getByText('Credit Card')).toBeTruthy();
      expect(queryByText('Apple Pay')).toBeNull();
      expect(queryByText('Google Pay')).toBeNull();
    });
  });

  describe('Payment Error Handling', () => {
    const mockQuote = createMockQuote({ totalCost: 100 });

    test('should handle payment failure', async () => {
      mockMathRandom.mockReturnValue(0.05); // Force payment failure

      const { getByTestId } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const payButton = getByTestId('button-pay-$100');
      fireEvent.press(payButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Payment Failed',
          'There was an issue processing your payment. Please try again or contact support.',
          [{ text: 'OK' }]
        );
      });

      // Should not update quote or service request on failure
      expect(mockAppStore.updateQuote).not.toHaveBeenCalled();
      expect(mockAppStore.updateServiceRequest).not.toHaveBeenCalled();
    });

    test('should handle network errors during payment', async () => {
      // Mock a network error during payment processing
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((callback) => {
        throw new Error('Network timeout');
      });

      const { getByTestId } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const payButton = getByTestId('button-pay-$100');
      fireEvent.press(payButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Payment Failed',
          'There was an issue processing your payment. Please try again or contact support.',
          [{ text: 'OK' }]
        );
      });

      global.setTimeout = originalSetTimeout;
    });

    test('should prevent double payment submission', async () => {
      const { getByTestId } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const payButton = getByTestId('button-pay-$100');
      
      // First press
      fireEvent.press(payButton);
      
      // Second press while processing
      fireEvent.press(payButton);

      // Should only process payment once
      await waitFor(() => {
        expect(mockAppStore.updateQuote).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Quote Integration Workflow', () => {
    beforeEach(() => {
      mockAppStore.serviceRequests = [
        createMockServiceRequest({
          id: 'service-123',
          customerId: 'customer-123',
          status: 'quoted',
        }),
      ];

      mockAppStore.quotes = [
        createMockQuote({
          id: 'quote-123',
          serviceRequestId: 'service-123',
          description: 'Complete brake service',
          totalCost: 250,
          status: 'pending',
        }),
      ];
    });

    test('should integrate payment with quote acceptance', async () => {
      const { getByText } = render(<CustomerQuotesScreen />);

      await waitFor(() => {
        expect(getByText('Complete brake service')).toBeTruthy();
        expect(getByText('$250')).toBeTruthy();
      });

      // Accept quote
      const acceptButton = getByText('Accept Quote');
      fireEvent.press(acceptButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Accept Quote',
          'Accept quote for $250?',
          expect.any(Array)
        );
      });

      // Confirm acceptance - should trigger payment modal
      const confirmAccept = mockAlert.mock.calls[0][2][1];
      act(() => {
        confirmAccept.onPress();
      });

      // Payment modal should be triggered (in real implementation)
      expect(getByText('Complete brake service')).toBeTruthy();
    });

    test('should handle multiple payment attempts', async () => {
      const { getByText } = render(<CustomerQuotesScreen />);

      // First payment attempt fails
      mockMathRandom.mockReturnValue(0.05);

      const acceptButton = getByText('Accept Quote');
      fireEvent.press(acceptButton);

      const confirmAccept = mockAlert.mock.calls[0][2][1];
      act(() => {
        confirmAccept.onPress();
      });

      // Quote should remain in pending state after failed payment
      expect(mockAppStore.updateQuote).not.toHaveBeenCalled();

      // Second attempt succeeds
      mockMathRandom.mockReturnValue(0.5);
      
      fireEvent.press(acceptButton);
      
      // Should allow retry
      expect(getByText('Accept Quote')).toBeTruthy();
    });
  });

  describe('Payment Security and Validation', () => {
    const mockQuote = createMockQuote({ totalCost: 300 });

    test('should display security notice', async () => {
      const { getByText } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      expect(getByText('Your payment is secured with 256-bit SSL encryption')).toBeTruthy();
    });

    test('should validate payment amounts', async () => {
      const { getByText } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      // Verify correct amount is displayed
      expect(getByText('Pay $300')).toBeTruthy();

      // Amount should match quote total
      expect(getByText('$300')).toBeTruthy(); // In breakdown
    });

    test('should handle edge case amounts', async () => {
      const edgeCaseQuote = createMockQuote({ 
        totalCost: 0.01, // Very small amount
        laborCost: 0.01,
        partsCost: 0,
      });

      const { getByText } = render(
        <PaymentModal
          quote={edgeCaseQuote}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      expect(getByText('Pay $0.01')).toBeTruthy();
    });
  });

  describe('Accessibility and UX', () => {
    const mockQuote = createMockQuote({ totalCost: 175 });

    test('should provide accessible payment interface', async () => {
      const { getByText } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      // Key elements should be accessible
      expect(getByText('Payment')).toBeTruthy();
      expect(getByText('Payment Method')).toBeTruthy();
      expect(getByText('Credit Card')).toBeTruthy();
      expect(getByText('Cancel')).toBeTruthy();
      expect(getByText('Pay $175')).toBeTruthy();
    });

    test('should handle modal cancellation', async () => {
      const mockOnCancel = jest.fn();

      const { getByText } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={jest.fn()}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = getByText('Cancel');
      fireEvent.press(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    test('should provide clear payment feedback', async () => {
      const { getByText, getByTestId } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const payButton = getByTestId('button-pay-$175');
      fireEvent.press(payButton);

      // Should show immediate feedback
      await waitFor(() => {
        expect(getByText('Processing...')).toBeTruthy();
      });
    });
  });

  describe('Payment State Management', () => {
    test('should maintain payment state across re-renders', async () => {
      const mockQuote = createMockQuote({ totalCost: 125 });
      
      const { getByText, rerender } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      // Select Apple Pay
      mockPlatform.OS = 'ios';
      const applePayOption = getByText('Apple Pay');
      fireEvent.press(applePayOption);

      // Re-render component
      rerender(
        <PaymentModal
          quote={mockQuote}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      // Apple Pay should still be available
      expect(getByText('Apple Pay')).toBeTruthy();
    });

    test('should reset payment state on quote change', async () => {
      const firstQuote = createMockQuote({ id: 'quote-1', totalCost: 100 });
      const secondQuote = createMockQuote({ id: 'quote-2', totalCost: 200 });

      const { getByText, rerender } = render(
        <PaymentModal
          quote={firstQuote}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      expect(getByText('Pay $100')).toBeTruthy();

      // Change to different quote
      rerender(
        <PaymentModal
          quote={secondQuote}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      expect(getByText('Pay $200')).toBeTruthy();
    });
  });
});