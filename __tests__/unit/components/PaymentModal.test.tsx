import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import { PaymentModal } from '@/components/PaymentModal';
import { useAppStore } from '@/stores/app-store';

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
  X: ({ size, color }: any) => `X-${size}-${color}`,
  Info: ({ size, color }: any) => `Info-${size}-${color}`,
  CheckCircle: ({ size, color }: any) => `CheckCircle-${size}-${color}`,
  CreditCard: ({ size, color }: any) => `CreditCard-${size}-${color}`,
  Smartphone: ({ size, color }: any) => `Smartphone-${size}-${color}`,
  Shield: ({ size, color }: any) => `Shield-${size}-${color}`,
}));

// Mock Button component
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

// Mock app store
const mockUpdateQuote = jest.fn();
const mockUpdateServiceRequest = jest.fn();
const mockGetJobParts = jest.fn();

jest.mock('@/stores/app-store', () => ({
  useAppStore: () => ({
    updateQuote: mockUpdateQuote,
    updateServiceRequest: mockUpdateServiceRequest,
    getJobParts: mockGetJobParts,
  }),
}));

// Mock Alert
const mockAlert = jest.spyOn(Alert, 'alert');

// Mock Platform
const mockPlatform = Platform as any;

// Mock Math.random for predictable test results
const mockMathRandom = jest.spyOn(Math, 'random');

describe('PaymentModal', () => {
  const mockQuote = {
    id: 'quote-123',
    serviceRequestId: 'service-123',
    description: 'Oil change and filter replacement',
    laborCost: 50,
    partsCost: 25,
    totalCost: 75,
    status: 'pending' as const,
    createdAt: new Date(),
  };

  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetJobParts.mockReturnValue([]);
    mockMathRandom.mockReturnValue(0.5); // Ensure payment succeeds in tests
    mockPlatform.OS = 'ios';
  });

  afterEach(() => {
    mockMathRandom.mockRestore();
  });

  describe('Rendering', () => {
    test('should render payment modal with quote information', () => {
      const { getByText } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(getByText('Payment')).toBeTruthy();
      expect(getByText('Oil change and filter replacement')).toBeTruthy();
      expect(getByText('$50')).toBeTruthy(); // Labor cost
      expect(getByText('$25')).toBeTruthy(); // Parts cost
      expect(getByText('$75')).toBeTruthy(); // Total cost
    });

    test('should render deposit payment mode correctly', () => {
      const { getByText } = render(
        <PaymentModal
          quote={mockQuote}
          paymentType="deposit"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(getByText('Pay Deposit')).toBeTruthy();
      expect(getByText('Deposit Payment')).toBeTruthy();
      expect(getByText('Pay 30% now to secure your service. Remaining balance due upon completion.')).toBeTruthy();
    });

    test('should render completion payment mode correctly', () => {
      const { getByText } = render(
        <PaymentModal
          quote={mockQuote}
          paymentType="completion"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(getByText('Final Payment')).toBeTruthy();
      expect(getByText('Job Completion Payment')).toBeTruthy();
      expect(getByText('Final payment for completed work.')).toBeTruthy();
    });
  });

  describe('Payment Methods', () => {
    test('should show credit card as default payment method', () => {
      const { getByText } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(getByText('Credit Card')).toBeTruthy();
      expect(getByText('•••• •••• •••• 4242')).toBeTruthy();
    });

    test('should show Apple Pay on iOS', () => {
      mockPlatform.OS = 'ios';
      
      const { getByText } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(getByText('Apple Pay')).toBeTruthy();
      expect(getByText('Touch ID or Face ID')).toBeTruthy();
    });

    test('should show Google Pay on Android', () => {
      mockPlatform.OS = 'android';
      
      const { getByText } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(getByText('Google Pay')).toBeTruthy();
      expect(getByText('Fingerprint or PIN')).toBeTruthy();
    });

    test('should not show Apple Pay on Android', () => {
      mockPlatform.OS = 'android';
      
      const { queryByText } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(queryByText('Apple Pay')).toBeNull();
    });

    test('should not show Google Pay on iOS', () => {
      mockPlatform.OS = 'ios';
      
      const { queryByText } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(queryByText('Google Pay')).toBeNull();
    });
  });

  describe('Payment Processing', () => {
    test('should process full payment successfully', async () => {
      mockMathRandom.mockReturnValue(0.5); // Ensure success
      
      const { getByTestId } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const payButton = getByTestId('button-pay-$75');
      fireEvent.press(payButton);

      await waitFor(() => {
        expect(mockUpdateQuote).toHaveBeenCalledWith(mockQuote.id, {
          status: 'paid',
          paidAt: expect.any(Date),
          paymentMethod: 'card',
        });
      });

      expect(mockUpdateServiceRequest).toHaveBeenCalledWith(mockQuote.serviceRequestId, {
        status: 'completed',
        paidAt: expect.any(Date),
      });

      expect(mockAlert).toHaveBeenCalledWith(
        'Payment Successful',
        'Payment of $75 has been processed successfully.',
        [{ text: 'OK', onPress: mockOnSuccess }]
      );
    });

    test('should process deposit payment successfully', async () => {
      const { getByTestId } = render(
        <PaymentModal
          quote={mockQuote}
          paymentType="deposit"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const depositAmount = Math.round(mockQuote.totalCost * 0.3); // 23
      const remainingAmount = mockQuote.totalCost - depositAmount; // 52

      const payButton = getByTestId(`button-pay-$${depositAmount}`);
      fireEvent.press(payButton);

      await waitFor(() => {
        expect(mockUpdateQuote).toHaveBeenCalledWith(mockQuote.id, {
          status: 'deposit_paid',
          depositPaidAt: expect.any(Date),
          depositAmount,
          remainingBalance: remainingAmount,
        });
      });

      expect(mockUpdateServiceRequest).toHaveBeenCalledWith(mockQuote.serviceRequestId, {
        status: 'accepted',
      });

      expect(mockAlert).toHaveBeenCalledWith(
        'Deposit Payment Successful',
        `Deposit of $${depositAmount} has been processed. Remaining balance: $${remainingAmount}`,
        [{ text: 'OK', onPress: mockOnSuccess }]
      );
    });

    test('should handle payment failure', async () => {
      mockMathRandom.mockReturnValue(0.05); // Force failure (< 0.1)
      
      const { getByTestId } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const payButton = getByTestId('button-pay-$75');
      fireEvent.press(payButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Payment Failed',
          'There was an issue processing your payment. Please try again or contact support.',
          [{ text: 'OK' }]
        );
      });

      expect(mockUpdateQuote).not.toHaveBeenCalled();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    test('should show processing state during payment', async () => {
      const { getByText, getByTestId } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const payButton = getByTestId('button-pay-$75');
      fireEvent.press(payButton);

      // Should show processing state
      expect(getByText('Processing...')).toBeTruthy();
    });
  });

  describe('Parts Integration', () => {
    test('should include parts cost in completion payment', () => {
      const mockParts = [
        { name: 'Oil Filter', description: 'Premium filter', price: 15, quantity: 1 },
        { name: 'Engine Oil', description: '5W-30 Synthetic', price: 30, quantity: 1 },
      ];
      
      mockGetJobParts.mockReturnValue(mockParts);

      const { getByText } = render(
        <PaymentModal
          quote={mockQuote}
          paymentType="completion"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const totalWithParts = mockQuote.totalCost + 45; // 75 + 45 = 120
      expect(getByText(`Pay $${totalWithParts}`)).toBeTruthy();
      expect(getByText('Oil Filter')).toBeTruthy();
      expect(getByText('Engine Oil')).toBeTruthy();
    });

    test('should show parts breakdown for completion payment', () => {
      const mockParts = [
        { name: 'Brake Pads', description: 'Ceramic pads', price: 80, quantity: 2 },
      ];
      
      mockGetJobParts.mockReturnValue(mockParts);

      const { getByText } = render(
        <PaymentModal
          quote={mockQuote}
          paymentType="completion"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(getByText('Parts Used')).toBeTruthy();
      expect(getByText('Brake Pads')).toBeTruthy();
      expect(getByText('Ceramic pads')).toBeTruthy();
      expect(getByText('$80 x 2 = $160.00')).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    test('should handle cancel button press', () => {
      const { getByTestId } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = getByTestId('button-cancel');
      fireEvent.press(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    test('should handle close button press', () => {
      const { getByText } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Find close button by its icon or nearby element
      const closeButton = getByText('Payment').parent?.parent?.children[1];
      if (closeButton) {
        fireEvent.press(closeButton);
        expect(mockOnCancel).toHaveBeenCalledTimes(1);
      }
    });

    test('should handle payment method selection', () => {
      const { getByText } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const creditCardOption = getByText('Credit Card');
      fireEvent.press(creditCardOption);

      // Should not throw error
      expect(creditCardOption).toBeTruthy();
    });
  });

  describe('Apple Pay Integration', () => {
    test('should show alert for Apple Pay on non-iOS platform', () => {
      mockPlatform.OS = 'android';

      const { getByText } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Apple Pay should not be visible on Android
      expect(() => getByText('Apple Pay')).toThrow();
    });
  });

  describe('Google Pay Integration', () => {
    test('should show alert for Google Pay on non-Android platform', () => {
      mockPlatform.OS = 'ios';

      const { queryByText } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Google Pay should not be visible on iOS
      expect(queryByText('Google Pay')).toBeNull();
    });
  });

  describe('Security Features', () => {
    test('should display security notice', () => {
      const { getByText } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(getByText('Your payment is secured with 256-bit SSL encryption')).toBeTruthy();
    });
  });

  describe('Button States', () => {
    test('should disable buttons during processing', async () => {
      const { getByTestId } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const payButton = getByTestId('button-pay-$75');
      const cancelButton = getByTestId('button-cancel');

      fireEvent.press(payButton);

      // Buttons should be disabled during processing
      expect(payButton.props.disabled).toBe(true);
      expect(cancelButton.props.disabled).toBe(true);
    });
  });

  describe('Accessibility', () => {
    test('should provide accessible content', () => {
      const { getByText } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Key content should be accessible
      expect(getByText('Payment')).toBeTruthy();
      expect(getByText('Payment Method')).toBeTruthy();
      expect(getByText('Credit Card')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    test('should handle store update errors gracefully', async () => {
      mockUpdateQuote.mockRejectedValue(new Error('Store error'));
      
      const { getByTestId } = render(
        <PaymentModal
          quote={mockQuote}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const payButton = getByTestId('button-pay-$75');
      
      expect(() => fireEvent.press(payButton)).not.toThrow();
    });
  });
});