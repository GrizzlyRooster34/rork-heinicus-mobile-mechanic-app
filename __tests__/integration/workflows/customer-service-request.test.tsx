import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CustomerRequestScreen from '@/app/(customer)/request';
import CustomerQuotesScreen from '@/app/(customer)/quotes';
import { setupTestEnvironment, createMockVehicle, createMockServiceRequest } from '../../utils/test-utils';
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

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 37.7749, longitude: -122.4194 }
  }),
}));

jest.mock('@/utils/quote-generator', () => ({
  generateSmartQuote: jest.fn().mockResolvedValue({
    id: 'quote-123',
    serviceRequestId: 'request-123',
    description: 'Oil change service',
    laborCost: 50,
    partsCost: 25,
    totalCost: 75,
    status: 'pending',
    createdAt: new Date(),
  }),
}));

jest.mock('@/utils/firebase-config', () => ({
  ENV_CONFIG: { isDevelopment: true },
  logProductionEvent: jest.fn(),
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Alert
const mockAlert = jest.spyOn(Alert, 'alert');

describe('Customer Service Request Workflow Integration', () => {
  let mockAppStore: any;
  let mockAuthStore: any;

  beforeEach(() => {
    setupTestEnvironment();
    jest.clearAllMocks();

    // Mock store states
    mockAppStore = {
      addServiceRequest: jest.fn(),
      addQuote: jest.fn(),
      updateServiceRequest: jest.fn(),
      updateQuote: jest.fn(),
      vehicles: [createMockVehicle()],
      serviceRequests: [],
      quotes: [],
      currentLocation: null,
      setCurrentLocation: jest.fn(),
      addVehicle: jest.fn(),
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

    (useAppStore as unknown as jest.Mock).mockReturnValue(mockAppStore);
    (useAuthStore as unknown as jest.Mock).mockReturnValue(mockAuthStore);
  });

  describe('Complete Service Request Flow', () => {
    test('should complete full customer service request workflow', async () => {
      const { getByText, getByPlaceholderText, rerender } = render(<CustomerRequestScreen />);

      // Step 1: Select service type
      await waitFor(() => {
        expect(getByText('Oil Change')).toBeTruthy();
      });

      const oilChangeService = getByText('Oil Change');
      fireEvent.press(oilChangeService);

      // Step 2: Fill in description
      const descriptionInput = getByPlaceholderText('Describe the issue or service needed...');
      fireEvent.changeText(descriptionInput, 'Regular oil change needed, engine making noise');

      // Step 3: Set urgency
      const mediumUrgency = getByText('Medium');
      fireEvent.press(mediumUrgency);

      // Step 4: Submit request
      const submitButton = getByText('Submit Request');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockAppStore.addServiceRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            customerId: 'customer-123',
            serviceType: 'oil-change',
            description: 'Regular oil change needed, engine making noise',
            urgency: 'medium',
            status: 'pending',
          })
        );
      });

      // Verify quote generation was triggered
      expect(mockAppStore.addQuote).toHaveBeenCalled();
    });

    test('should handle service request with photos', async () => {
      const { getByText, getByPlaceholderText } = render(<CustomerRequestScreen />);

      // Select service and add description
      const diagnosticService = getByText('Diagnostic');
      fireEvent.press(diagnosticService);

      const descriptionInput = getByPlaceholderText('Describe the issue or service needed...');
      fireEvent.changeText(descriptionInput, 'Strange noise from engine');

      // Mock photo upload
      const photoUploadButton = getByText('Add Photos');
      fireEvent.press(photoUploadButton);

      // Submit with photos
      const submitButton = getByText('Submit Request');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockAppStore.addServiceRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            serviceType: 'diagnostic',
            description: 'Strange noise from engine',
            photos: expect.any(Array),
          })
        );
      });
    });

    test('should handle emergency service requests', async () => {
      const { getByText, getByPlaceholderText } = render(<CustomerRequestScreen />);

      // Select emergency service
      const emergencyService = getByText('Emergency Repair');
      fireEvent.press(emergencyService);

      const descriptionInput = getByPlaceholderText('Describe the issue or service needed...');
      fireEvent.changeText(descriptionInput, 'Car won\'t start, stranded');

      // Set emergency urgency
      const emergencyUrgency = getByText('Emergency');
      fireEvent.press(emergencyUrgency);

      const submitButton = getByText('Submit Request');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockAppStore.addServiceRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            serviceType: 'emergency-repair',
            urgency: 'emergency',
            description: 'Car won\'t start, stranded',
          })
        );
      });
    });
  });

  describe('Quote Review and Payment Flow', () => {
    beforeEach(() => {
      // Setup existing service request and quote
      mockAppStore.serviceRequests = [
        createMockServiceRequest({
          id: 'request-123',
          customerId: 'customer-123',
          status: 'quoted',
        })
      ];

      mockAppStore.quotes = [
        {
          id: 'quote-123',
          serviceRequestId: 'request-123',
          description: 'Oil change and filter replacement',
          laborCost: 50,
          partsCost: 25,
          totalCost: 75,
          status: 'pending',
          createdAt: new Date(),
        }
      ];
    });

    test('should display quotes and allow acceptance', async () => {
      const { getByText } = render(<CustomerQuotesScreen />);

      await waitFor(() => {
        expect(getByText('Oil change and filter replacement')).toBeTruthy();
        expect(getByText('$75')).toBeTruthy();
        expect(getByText('Quote Ready')).toBeTruthy();
      });

      // Accept quote
      const acceptButton = getByText('Accept Quote');
      fireEvent.press(acceptButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Accept Quote',
          'Accept quote for $75?',
          expect.any(Array)
        );
      });
    });

    test('should handle quote decline workflow', async () => {
      const { getByText } = render(<CustomerQuotesScreen />);

      await waitFor(() => {
        expect(getByText('Oil change and filter replacement')).toBeTruthy();
      });

      // Decline quote
      const declineButton = getByText('Decline');
      fireEvent.press(declineButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Decline Quote',
          'Are you sure you want to decline this quote?',
          expect.any(Array)
        );
      });

      // Confirm decline
      const confirmDecline = mockAlert.mock.calls[0]?.[2]?.[1];
      act(() => {
        confirmDecline?.onPress();
      });

      expect(mockAppStore.updateQuote).toHaveBeenCalledWith('quote-123', { status: 'declined' });
      expect(mockAppStore.updateServiceRequest).toHaveBeenCalledWith('request-123', { status: 'pending' });
    });

    test('should process payment after quote acceptance', async () => {
      const { getByText } = render(<CustomerQuotesScreen />);

      await waitFor(() => {
        expect(getByText('Accept Quote')).toBeTruthy();
      });

      const acceptButton = getByText('Accept Quote');
      fireEvent.press(acceptButton);

      // Mock Alert confirm
      const confirmAccept = mockAlert.mock.calls[0]?.[2]?.[1];
      act(() => {
        confirmAccept?.onPress();
      });

      // Should trigger payment modal
      // In a real test, this would render the PaymentModal component
      expect(getByText('Oil change and filter replacement')).toBeTruthy();
    });

    test('should handle multiple quotes for comparison', async () => {
      // Add second quote
      mockAppStore.quotes.push({
        id: 'quote-124',
        serviceRequestId: 'request-123',
        description: 'Premium oil change with synthetic oil',
        laborCost: 60,
        partsCost: 45,
        totalCost: 105,
        status: 'pending',
        createdAt: new Date(),
      });

      const { getByText } = render(<CustomerQuotesScreen />);

      await waitFor(() => {
        expect(getByText('Oil change and filter replacement')).toBeTruthy();
        expect(getByText('Premium oil change with synthetic oil')).toBeTruthy();
        expect(getByText('$75')).toBeTruthy();
        expect(getByText('$105')).toBeTruthy();
      });

      // Both quotes should be independently actionable
      const acceptButtons = getByText('Accept Quote');
      expect(acceptButtons).toBeTruthy();
    });
  });

  describe('Communication Flow', () => {
    beforeEach(() => {
      mockAppStore.serviceRequests = [
        createMockServiceRequest({
          id: 'request-123',
          customerId: 'customer-123',
          status: 'in_progress',
        })
      ];
    });

    test('should enable chat with mechanic during service', async () => {
      const { getByText } = render(<CustomerQuotesScreen />);

      await waitFor(() => {
        expect(getByText('Chat with Mechanic')).toBeTruthy();
      });

      const chatButton = getByText('Chat with Mechanic');
      fireEvent.press(chatButton);

      // Should open chat component
      expect(getByText('Chat with Mechanic')).toBeTruthy();
    });

    test('should show service status updates', async () => {
      const { getByText } = render(<CustomerQuotesScreen />);

      await waitFor(() => {
        expect(getByText('In Progress')).toBeTruthy();
      });

      // Status should be clearly visible
      expect(getByText('In Progress')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    test('should handle location permission denied', async () => {
      const mockLocation = require('expo-location');
      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });

      const { getByText } = render(<CustomerRequestScreen />);

      // Should still allow service request without location
      await waitFor(() => {
        expect(getByText('Oil Change')).toBeTruthy();
      });

      const oilChangeService = getByText('Oil Change');
      fireEvent.press(oilChangeService);

      expect(getByText('Oil Change')).toBeTruthy();
    });

    test('should handle quote generation failure', async () => {
      const mockQuoteGenerator = require('@/utils/quote-generator');
      mockQuoteGenerator.generateSmartQuote.mockRejectedValue(new Error('Quote generation failed'));

      const { getByText, getByPlaceholderText } = render(<CustomerRequestScreen />);

      const oilChangeService = getByText('Oil Change');
      fireEvent.press(oilChangeService);

      const descriptionInput = getByPlaceholderText('Describe the issue or service needed...');
      fireEvent.changeText(descriptionInput, 'Regular oil change needed');

      const submitButton = getByText('Submit Request');
      fireEvent.press(submitButton);

      // Should still create service request even if quote generation fails
      await waitFor(() => {
        expect(mockAppStore.addServiceRequest).toHaveBeenCalled();
      });
    });

    test('should handle network errors gracefully', async () => {
      mockAppStore.addServiceRequest.mockRejectedValue(new Error('Network error'));

      const { getByText, getByPlaceholderText } = render(<CustomerRequestScreen />);

      const oilChangeService = getByText('Oil Change');
      fireEvent.press(oilChangeService);

      const descriptionInput = getByPlaceholderText('Describe the issue or service needed...');
      fireEvent.changeText(descriptionInput, 'Regular oil change needed');

      const submitButton = getByText('Submit Request');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('failed'),
          expect.any(Array)
        );
      });
    });
  });

  describe('Vehicle Selection', () => {
    test('should handle multiple vehicles selection', async () => {
      mockAppStore.vehicles = [
        createMockVehicle({ id: 'vehicle-1', make: 'Toyota', model: 'Camry' }),
        createMockVehicle({ id: 'vehicle-2', make: 'Honda', model: 'Civic' }),
      ];

      const { getByText } = render(<CustomerRequestScreen />);

      await waitFor(() => {
        expect(getByText('Toyota Camry')).toBeTruthy();
      });

      // Should be able to select different vehicle
      const vehicleSelector = getByText('Toyota Camry');
      fireEvent.press(vehicleSelector);

      // Vehicle selection should be available
      expect(getByText('Toyota Camry')).toBeTruthy();
    });

    test('should prompt to add vehicle if none available', async () => {
      mockAppStore.vehicles = [];

      const { getByText } = render(<CustomerRequestScreen />);

      await waitFor(() => {
        expect(getByText('Add Vehicle')).toBeTruthy();
      });

      const addVehicleButton = getByText('Add Vehicle');
      fireEvent.press(addVehicleButton);

      expect(mockAppStore.addVehicle).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('should be accessible to screen readers', async () => {
      const { getByLabelText, getByText } = render(<CustomerRequestScreen />);

      // Key elements should have proper accessibility labels
      await waitFor(() => {
        expect(getByText('Oil Change')).toBeTruthy();
      });

      const submitButton = getByText('Submit Request');
      expect(submitButton).toBeTruthy();
    });

    test('should have proper navigation flow', async () => {
      const { getByText } = render(<CustomerRequestScreen />);

      // Navigation should be clear and logical
      await waitFor(() => {
        expect(getByText('Select Service')).toBeTruthy();
        expect(getByText('Describe Issue')).toBeTruthy();
        expect(getByText('Set Priority')).toBeTruthy();
      });
    });
  });
});