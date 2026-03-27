import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import MechanicJobsScreen from '@/app/(mechanic)/jobs';
import MechanicDashboardScreen from '@/app/(mechanic)/dashboard';
import { setupTestEnvironment, createMockServiceRequest, createMockQuote } from '../../utils/test-utils';
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

jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Alert
const mockAlert = jest.spyOn(Alert, 'alert');

describe('Mechanic Job Workflow Integration', () => {
  let mockAppStore: any;
  let mockAuthStore: any;

  beforeEach(() => {
    setupTestEnvironment();
    jest.clearAllMocks();

    // Mock store states
    mockAppStore = {
      serviceRequests: [],
      quotes: [],
      addQuote: jest.fn(),
      updateQuote: jest.fn(),
      updateServiceRequest: jest.fn(),
      addJobPart: jest.fn(),
      getJobParts: jest.fn().mockReturnValue([]),
      mechanics: [
        {
          id: 'mechanic-123',
          email: 'mechanic@test.com',
          firstName: 'Test',
          lastName: 'Mechanic',
          specialties: ['oil-change', 'brake-repair'],
          isAvailable: true,
          currentLocation: { latitude: 37.7749, longitude: -122.4194 },
        }
      ],
    };

    mockAuthStore = {
      user: {
        id: 'mechanic-123',
        email: 'mechanic@test.com',
        firstName: 'Test',
        lastName: 'Mechanic',
        role: 'mechanic',
        createdAt: new Date(),
      },
    };

    (useAppStore as unknown as jest.Mock).mockReturnValue(mockAppStore);
    (useAuthStore as unknown as jest.Mock).mockReturnValue(mockAuthStore);
  });

  describe('Job Discovery and Assignment', () => {
    test('should display available jobs matching mechanic specialties', async () => {
      mockAppStore.serviceRequests = [
        createMockServiceRequest({
          id: 'request-123',
          serviceType: 'oil-change',
          status: 'pending',
          urgency: 'medium',
          description: 'Regular oil change needed',
        }),
        createMockServiceRequest({
          id: 'request-124',
          serviceType: 'brake-repair',
          status: 'pending',
          urgency: 'high',
          description: 'Brake pads need replacement',
        }),
        createMockServiceRequest({
          id: 'request-125',
          serviceType: 'transmission-repair',
          status: 'pending',
          urgency: 'low',
          description: 'Transmission issues',
        }),
      ];

      const { getByText, queryByText } = render(<MechanicJobsScreen />);

      await waitFor(() => {
        // Should show jobs matching specialties
        expect(getByText('Regular oil change needed')).toBeTruthy();
        expect(getByText('Brake pads need replacement')).toBeTruthy();
        
        // Should not show jobs outside specialties
        expect(queryByText('Transmission issues')).toBeNull();
      });
    });

    test('should allow mechanic to view job details', async () => {
      mockAppStore.serviceRequests = [
        createMockServiceRequest({
          id: 'request-123',
          serviceType: 'oil-change',
          status: 'pending',
          urgency: 'medium',
          description: 'Regular oil change needed',
          customerLocation: { latitude: 37.7849, longitude: -122.4094 },
        }),
      ];

      const { getByText } = render(<MechanicJobsScreen />);

      await waitFor(() => {
        expect(getByText('Regular oil change needed')).toBeTruthy();
      });

      const jobCard = getByText('Regular oil change needed');
      fireEvent.press(jobCard);

      // Should show detailed view
      await waitFor(() => {
        expect(getByText('Job Details')).toBeTruthy();
        expect(getByText('Medium Priority')).toBeTruthy();
      });
    });

    test('should handle emergency job prioritization', async () => {
      mockAppStore.serviceRequests = [
        createMockServiceRequest({
          id: 'request-123',
          serviceType: 'oil-change',
          status: 'pending',
          urgency: 'medium',
          description: 'Regular oil change needed',
        }),
        createMockServiceRequest({
          id: 'request-124',
          serviceType: 'emergency-repair',
          status: 'pending',
          urgency: 'emergency',
          description: 'Car won\'t start, customer stranded',
        }),
      ];

      const { getByText } = render(<MechanicJobsScreen />);

      await waitFor(() => {
        expect(getByText('Car won\'t start, customer stranded')).toBeTruthy();
        expect(getByText('Emergency')).toBeTruthy();
      });

      // Emergency job should be prominently displayed
      const emergencyJob = getByText('Car won\'t start, customer stranded');
      expect(emergencyJob).toBeTruthy();
    });
  });

  describe('Quote Creation Workflow', () => {
    test('should allow mechanic to create detailed quote', async () => {
      mockAppStore.serviceRequests = [
        createMockServiceRequest({
          id: 'request-123',
          serviceType: 'brake-repair',
          status: 'pending',
          description: 'Brake pads need replacement',
        }),
      ];

      const { getByText, getByPlaceholderText } = render(<MechanicJobsScreen />);

      await waitFor(() => {
        expect(getByText('Brake pads need replacement')).toBeTruthy();
      });

      // Start quote creation
      const createQuoteButton = getByText('Create Quote');
      fireEvent.press(createQuoteButton);

      await waitFor(() => {
        expect(getByText('Create Quote')).toBeTruthy();
      });

      // Fill quote details
      const laborCostInput = getByPlaceholderText('Labor cost');
      fireEvent.changeText(laborCostInput, '120');

      const partsCostInput = getByPlaceholderText('Parts cost');
      fireEvent.changeText(partsCostInput, '80');

      const descriptionInput = getByPlaceholderText('Detailed description of work');
      fireEvent.changeText(descriptionInput, 'Replace front brake pads and inspect rotors');

      // Submit quote
      const submitQuoteButton = getByText('Submit Quote');
      fireEvent.press(submitQuoteButton);

      await waitFor(() => {
        expect(mockAppStore.addQuote).toHaveBeenCalledWith(
          expect.objectContaining({
            serviceRequestId: 'request-123',
            laborCost: 120,
            partsCost: 80,
            totalCost: 200,
            description: 'Replace front brake pads and inspect rotors',
            status: 'pending',
          })
        );
      });

      expect(mockAppStore.updateServiceRequest).toHaveBeenCalledWith('request-123', {
        status: 'quoted',
      });
    });

    test('should handle quote with multiple parts breakdown', async () => {
      mockAppStore.serviceRequests = [
        createMockServiceRequest({
          id: 'request-123',
          serviceType: 'oil-change',
          status: 'pending',
        }),
      ];

      const { getByText, getByPlaceholderText } = render(<MechanicJobsScreen />);

      await waitFor(() => {
        expect(getByText('Create Quote')).toBeTruthy();
      });

      const createQuoteButton = getByText('Create Quote');
      fireEvent.press(createQuoteButton);

      // Add multiple parts
      const addPartButton = getByText('Add Part');
      fireEvent.press(addPartButton);

      const partNameInput = getByPlaceholderText('Part name');
      fireEvent.changeText(partNameInput, 'Oil Filter');

      const partPriceInput = getByPlaceholderText('Part price');
      fireEvent.changeText(partPriceInput, '15');

      // Add second part
      fireEvent.press(addPartButton);

      const secondPartNameInput = getByPlaceholderText('Part name');
      fireEvent.changeText(secondPartNameInput, 'Engine Oil (5W-30)');

      const secondPartPriceInput = getByPlaceholderText('Part price');
      fireEvent.changeText(secondPartPriceInput, '30');

      const laborCostInput = getByPlaceholderText('Labor cost');
      fireEvent.changeText(laborCostInput, '50');

      const submitQuoteButton = getByText('Submit Quote');
      fireEvent.press(submitQuoteButton);

      await waitFor(() => {
        expect(mockAppStore.addQuote).toHaveBeenCalledWith(
          expect.objectContaining({
            laborCost: 50,
            partsCost: 45, // 15 + 30
            totalCost: 95,
            parts: expect.arrayContaining([
              expect.objectContaining({ name: 'Oil Filter', price: 15 }),
              expect.objectContaining({ name: 'Engine Oil (5W-30)', price: 30 }),
            ]),
          })
        );
      });
    });
  });

  describe('Job Execution Workflow', () => {
    beforeEach(() => {
      mockAppStore.serviceRequests = [
        createMockServiceRequest({
          id: 'request-123',
          serviceType: 'brake-repair',
          status: 'accepted',
          mechanicId: 'mechanic-123',
        }),
      ];

      mockAppStore.quotes = [
        createMockQuote({
          id: 'quote-123',
          serviceRequestId: 'request-123',
          status: 'accepted',
        }),
      ];
    });

    test('should allow mechanic to start job', async () => {
      const { getByText } = render(<MechanicJobsScreen />);

      await waitFor(() => {
        expect(getByText('Start Job')).toBeTruthy();
      });

      const startJobButton = getByText('Start Job');
      fireEvent.press(startJobButton);

      await waitFor(() => {
        expect(mockAppStore.updateServiceRequest).toHaveBeenCalledWith('request-123', {
          status: 'in_progress',
          startedAt: expect.any(Date),
        });
      });
    });

    test('should track job progress with photos', async () => {
      // Update service request to in_progress
      mockAppStore.serviceRequests[0].status = 'in_progress';

      const { getByText } = render(<MechanicJobsScreen />);

      await waitFor(() => {
        expect(getByText('Add Progress Photo')).toBeTruthy();
      });

      const addPhotoButton = getByText('Add Progress Photo');
      fireEvent.press(addPhotoButton);

      // Mock photo capture
      await waitFor(() => {
        expect(getByText('Photo added')).toBeTruthy();
      });
    });

    test('should handle additional parts requests', async () => {
      mockAppStore.serviceRequests[0].status = 'in_progress';

      const { getByText, getByPlaceholderText } = render(<MechanicJobsScreen />);

      await waitFor(() => {
        expect(getByText('Request Additional Parts')).toBeTruthy();
      });

      const requestPartsButton = getByText('Request Additional Parts');
      fireEvent.press(requestPartsButton);

      const partNameInput = getByPlaceholderText('Part name');
      fireEvent.changeText(partNameInput, 'Brake Fluid');

      const partPriceInput = getByPlaceholderText('Estimated price');
      fireEvent.changeText(partPriceInput, '12');

      const reasonInput = getByPlaceholderText('Reason for additional part');
      fireEvent.changeText(reasonInput, 'Brake fluid contaminated, needs replacement');

      const submitPartsButton = getByText('Submit Request');
      fireEvent.press(submitPartsButton);

      await waitFor(() => {
        expect(mockAppStore.addJobPart).toHaveBeenCalledWith('request-123', {
          name: 'Brake Fluid',
          price: 12,
          reason: 'Brake fluid contaminated, needs replacement',
          approved: false,
        });
      });
    });

    test('should complete job with final inspection', async () => {
      mockAppStore.serviceRequests[0].status = 'in_progress';

      const { getByText, getByPlaceholderText } = render(<MechanicJobsScreen />);

      await waitFor(() => {
        expect(getByText('Complete Job')).toBeTruthy();
      });

      const completeJobButton = getByText('Complete Job');
      fireEvent.press(completeJobButton);

      // Fill completion details
      const summaryInput = getByPlaceholderText('Work summary');
      fireEvent.changeText(summaryInput, 'Replaced front brake pads, inspected rotors - good condition');

      const recommendationsInput = getByPlaceholderText('Recommendations');
      fireEvent.changeText(recommendationsInput, 'Next brake service due in 30,000 miles');

      const finishButton = getByText('Finish Job');
      fireEvent.press(finishButton);

      await waitFor(() => {
        expect(mockAppStore.updateServiceRequest).toHaveBeenCalledWith('request-123', {
          status: 'completed',
          completedAt: expect.any(Date),
          workSummary: 'Replaced front brake pads, inspected rotors - good condition',
          recommendations: 'Next brake service due in 30,000 miles',
        });
      });
    });
  });

  describe('Customer Communication', () => {
    test('should allow mechanic to communicate with customer', async () => {
      mockAppStore.serviceRequests = [
        createMockServiceRequest({
          id: 'request-123',
          status: 'in_progress',
          mechanicId: 'mechanic-123',
        }),
      ];

      const { getByText } = render(<MechanicJobsScreen />);

      await waitFor(() => {
        expect(getByText('Message Customer')).toBeTruthy();
      });

      const messageButton = getByText('Message Customer');
      fireEvent.press(messageButton);

      // Should open chat interface
      await waitFor(() => {
        expect(getByText('Chat with Customer')).toBeTruthy();
      });
    });

    test('should send progress updates to customer', async () => {
      mockAppStore.serviceRequests = [
        createMockServiceRequest({
          id: 'request-123',
          status: 'in_progress',
          mechanicId: 'mechanic-123',
        }),
      ];

      const { getByText } = render(<MechanicJobsScreen />);

      await waitFor(() => {
        expect(getByText('Send Update')).toBeTruthy();
      });

      const sendUpdateButton = getByText('Send Update');
      fireEvent.press(sendUpdateButton);

      await waitFor(() => {
        expect(getByText('Progress Update Sent')).toBeTruthy();
      });
    });
  });

  describe('Dashboard and Analytics', () => {
    test('should display mechanic dashboard with job summary', async () => {
      mockAppStore.serviceRequests = [
        createMockServiceRequest({
          id: 'request-123',
          status: 'completed',
          mechanicId: 'mechanic-123',
          completedAt: new Date(),
        }),
        createMockServiceRequest({
          id: 'request-124',
          status: 'in_progress',
          mechanicId: 'mechanic-123',
        }),
        createMockServiceRequest({
          id: 'request-125',
          status: 'accepted',
          mechanicId: 'mechanic-123',
        }),
      ];

      const { getByText } = render(<MechanicDashboardScreen />);

      await waitFor(() => {
        expect(getByText('Jobs Today')).toBeTruthy();
        expect(getByText('3')).toBeTruthy(); // Total jobs
        expect(getByText('1 Completed')).toBeTruthy();
        expect(getByText('1 In Progress')).toBeTruthy();
        expect(getByText('1 Scheduled')).toBeTruthy();
      });
    });

    test('should show earnings summary', async () => {
      mockAppStore.quotes = [
        createMockQuote({
          id: 'quote-123',
          mechanicId: 'mechanic-123',
          totalCost: 150,
          status: 'paid',
          paidAt: new Date(),
        }),
        createMockQuote({
          id: 'quote-124',
          mechanicId: 'mechanic-123',
          totalCost: 75,
          status: 'paid',
          paidAt: new Date(),
        }),
      ];

      const { getByText } = render(<MechanicDashboardScreen />);

      await waitFor(() => {
        expect(getByText('Today\'s Earnings')).toBeTruthy();
        expect(getByText('$225')).toBeTruthy(); // Total earnings
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle quote submission failure', async () => {
      mockAppStore.addQuote.mockRejectedValue(new Error('Network error'));
      mockAppStore.serviceRequests = [
        createMockServiceRequest({
          id: 'request-123',
          status: 'pending',
        }),
      ];

      const { getByText, getByPlaceholderText } = render(<MechanicJobsScreen />);

      const createQuoteButton = getByText('Create Quote');
      fireEvent.press(createQuoteButton);

      const laborCostInput = getByPlaceholderText('Labor cost');
      fireEvent.changeText(laborCostInput, '100');

      const submitQuoteButton = getByText('Submit Quote');
      fireEvent.press(submitQuoteButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('failed'),
          expect.any(Array)
        );
      });
    });

    test('should handle job assignment conflicts', async () => {
      mockAppStore.serviceRequests = [
        createMockServiceRequest({
          id: 'request-123',
          status: 'assigned',
          mechanicId: 'other-mechanic-456',
        }),
      ];

      const { queryByText } = render(<MechanicJobsScreen />);

      await waitFor(() => {
        // Should not show jobs assigned to other mechanics
        expect(queryByText('Create Quote')).toBeNull();
      });
    });

    test('should handle location unavailable', async () => {
      mockAppStore.mechanics[0].currentLocation = null;

      const { getByText } = render(<MechanicDashboardScreen />);

      await waitFor(() => {
        expect(getByText('Location Unavailable')).toBeTruthy();
      });
    });
  });

  describe('Availability Management', () => {
    test('should allow mechanic to toggle availability', async () => {
      const { getByText } = render(<MechanicDashboardScreen />);

      await waitFor(() => {
        expect(getByText('Available')).toBeTruthy();
      });

      const availabilityToggle = getByText('Available');
      fireEvent.press(availabilityToggle);

      await waitFor(() => {
        expect(getByText('Unavailable')).toBeTruthy();
      });
    });

    test('should filter jobs based on availability', async () => {
      mockAppStore.mechanics[0].isAvailable = false;
      mockAppStore.serviceRequests = [
        createMockServiceRequest({
          id: 'request-123',
          status: 'pending',
          urgency: 'emergency',
        }),
      ];

      const { queryByText } = render(<MechanicJobsScreen />);

      // Should not show new jobs when unavailable (except emergencies)
      await waitFor(() => {
        expect(queryByText('Regular oil change needed')).toBeNull();
      });
    });
  });
});