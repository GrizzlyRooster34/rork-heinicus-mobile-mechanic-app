import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AdminIndexScreen from '@/app/(admin)/index';
import AdminUsersScreen from '@/app/(admin)/users';
import AdminJobsScreen from '@/app/(admin)/jobs';
import AdminQuotesScreen from '@/app/(admin)/quotes';
import { setupTestEnvironment, createMockUser, createMockServiceRequest, createMockQuote } from '../../utils/test-utils';
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

describe('Admin Management Workflow Integration', () => {
  let mockAppStore: any;
  let mockAuthStore: any;

  beforeEach(() => {
    setupTestEnvironment();
    jest.clearAllMocks();

    // Mock store states
    mockAppStore = {
      serviceRequests: [],
      quotes: [],
      customers: [],
      mechanics: [],
      adminProfiles: [],
      updateServiceRequest: jest.fn(),
      updateQuote: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      addUser: jest.fn(),
      getAllStats: jest.fn(),
      getRevenueStats: jest.fn(),
      getUserMetrics: jest.fn(),
    };

    mockAuthStore = {
      user: {
        id: 'admin-123',
        email: 'admin@test.com',
        firstName: 'Test',
        lastName: 'Admin',
        role: 'admin',
        createdAt: new Date(),
      },
      updateUserRole: jest.fn(),
      getAllUsers: jest.fn(),
    };

    (useAppStore as jest.Mock).mockReturnValue(mockAppStore);
    (useAuthStore as jest.Mock).mockReturnValue(mockAuthStore);
  });

  describe('Dashboard Overview', () => {
    test('should display comprehensive system overview', async () => {
      mockAppStore.getAllStats.mockReturnValue({
        totalJobs: 150,
        activeJobs: 25,
        completedJobs: 120,
        pendingQuotes: 15,
        totalRevenue: 45000,
        thisMonthRevenue: 12000,
      });

      mockAppStore.customers = [
        createMockUser({ role: 'customer' }),
        createMockUser({ role: 'customer' }),
      ];

      mockAppStore.mechanics = [
        createMockUser({ role: 'mechanic' }),
        createMockUser({ role: 'mechanic' }),
        createMockUser({ role: 'mechanic' }),
      ];

      const { getByText } = render(<AdminIndexScreen />);

      await waitFor(() => {
        expect(getByText('System Overview')).toBeTruthy();
        expect(getByText('150')).toBeTruthy(); // Total jobs
        expect(getByText('25')).toBeTruthy(); // Active jobs
        expect(getByText('$45,000')).toBeTruthy(); // Total revenue
        expect(getByText('2 Customers')).toBeTruthy();
        expect(getByText('3 Mechanics')).toBeTruthy();
      });
    });

    test('should show recent activity and alerts', async () => {
      mockAppStore.serviceRequests = [
        createMockServiceRequest({
          urgency: 'emergency',
          status: 'pending',
          description: 'Emergency repair needed',
          createdAt: new Date(),
        }),
        createMockServiceRequest({
          urgency: 'high',
          status: 'quoted',
          description: 'Brake repair quote sent',
          createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        }),
      ];

      const { getByText } = render(<AdminIndexScreen />);

      await waitFor(() => {
        expect(getByText('Recent Activity')).toBeTruthy();
        expect(getByText('Emergency repair needed')).toBeTruthy();
        expect(getByText('Emergency Alert')).toBeTruthy();
      });
    });

    test('should display performance metrics', async () => {
      mockAppStore.getRevenueStats.mockReturnValue({
        daily: [1200, 1500, 980, 2100, 1800],
        weekly: [8500, 9200, 7800, 10500],
        monthly: [35000, 38000, 42000, 45000],
      });

      const { getByText } = render(<AdminIndexScreen />);

      await waitFor(() => {
        expect(getByText('Performance Metrics')).toBeTruthy();
        expect(getByText('Revenue Trend')).toBeTruthy();
      });
    });
  });

  describe('User Management', () => {
    beforeEach(() => {
      mockAppStore.customers = [
        createMockUser({
          id: 'customer-1',
          email: 'customer1@test.com',
          role: 'customer',
          isActive: true,
        }),
        createMockUser({
          id: 'customer-2',
          email: 'customer2@test.com',
          role: 'customer',
          isActive: false,
        }),
      ];

      mockAppStore.mechanics = [
        createMockUser({
          id: 'mechanic-1',
          email: 'mechanic1@test.com',
          role: 'mechanic',
          isActive: true,
        }),
      ];

      mockAuthStore.getAllUsers.mockReturnValue([
        ...mockAppStore.customers,
        ...mockAppStore.mechanics,
      ]);
    });

    test('should display all users with filtering options', async () => {
      const { getByText, getByPlaceholderText } = render(<AdminUsersScreen />);

      await waitFor(() => {
        expect(getByText('customer1@test.com')).toBeTruthy();
        expect(getByText('customer2@test.com')).toBeTruthy();
        expect(getByText('mechanic1@test.com')).toBeTruthy();
      });

      // Test role filtering
      const roleFilter = getByText('All Roles');
      fireEvent.press(roleFilter);

      const customerFilter = getByText('Customers');
      fireEvent.press(customerFilter);

      await waitFor(() => {
        expect(getByText('customer1@test.com')).toBeTruthy();
        // Mechanic should be filtered out
      });
    });

    test('should allow admin to edit user details', async () => {
      const { getByText } = render(<AdminUsersScreen />);

      await waitFor(() => {
        expect(getByText('customer1@test.com')).toBeTruthy();
      });

      const editButton = getByText('Edit');
      fireEvent.press(editButton);

      await waitFor(() => {
        expect(getByText('Edit User')).toBeTruthy();
      });

      // Edit user details
      const firstNameInput = getByText('John'); // Assuming current name
      fireEvent.changeText(firstNameInput, 'Jane');

      const saveButton = getByText('Save Changes');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockAppStore.updateUser).toHaveBeenCalledWith('customer-1', {
          firstName: 'Jane',
        });
      });
    });

    test('should handle user role changes', async () => {
      const { getByText } = render(<AdminUsersScreen />);

      await waitFor(() => {
        expect(getByText('customer1@test.com')).toBeTruthy();
      });

      const changeRoleButton = getByText('Change Role');
      fireEvent.press(changeRoleButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Change User Role',
          expect.any(String),
          expect.any(Array)
        );
      });

      // Confirm role change
      const confirmButton = mockAlert.mock.calls[0][2][1];
      act(() => {
        confirmButton.onPress();
      });

      expect(mockAuthStore.updateUserRole).toHaveBeenCalledWith('customer-1', 'mechanic');
    });

    test('should handle user deactivation/activation', async () => {
      const { getByText } = render(<AdminUsersScreen />);

      await waitFor(() => {
        expect(getByText('customer1@test.com')).toBeTruthy();
      });

      const deactivateButton = getByText('Deactivate');
      fireEvent.press(deactivateButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Deactivate User',
          expect.any(String),
          expect.any(Array)
        );
      });

      const confirmDeactivate = mockAlert.mock.calls[0][2][1];
      act(() => {
        confirmDeactivate.onPress();
      });

      expect(mockAppStore.updateUser).toHaveBeenCalledWith('customer-1', {
        isActive: false,
      });
    });

    test('should allow adding new users', async () => {
      const { getByText, getByPlaceholderText } = render(<AdminUsersScreen />);

      const addUserButton = getByText('Add User');
      fireEvent.press(addUserButton);

      await waitFor(() => {
        expect(getByText('Add New User')).toBeTruthy();
      });

      // Fill user details
      const emailInput = getByPlaceholderText('Email');
      fireEvent.changeText(emailInput, 'newuser@test.com');

      const firstNameInput = getByPlaceholderText('First Name');
      fireEvent.changeText(firstNameInput, 'New');

      const lastNameInput = getByPlaceholderText('Last Name');
      fireEvent.changeText(lastNameInput, 'User');

      const roleSelector = getByText('Customer');
      fireEvent.press(roleSelector);

      const createUserButton = getByText('Create User');
      fireEvent.press(createUserButton);

      await waitFor(() => {
        expect(mockAppStore.addUser).toHaveBeenCalledWith({
          email: 'newuser@test.com',
          firstName: 'New',
          lastName: 'User',
          role: 'customer',
        });
      });
    });
  });

  describe('Job Oversight', () => {
    beforeEach(() => {
      mockAppStore.serviceRequests = [
        createMockServiceRequest({
          id: 'request-123',
          status: 'pending',
          urgency: 'high',
          description: 'Brake repair needed',
          createdAt: new Date(),
        }),
        createMockServiceRequest({
          id: 'request-124',
          status: 'in_progress',
          urgency: 'medium',
          description: 'Oil change in progress',
          mechanicId: 'mechanic-1',
          createdAt: new Date(Date.now() - 7200000), // 2 hours ago
        }),
        createMockServiceRequest({
          id: 'request-125',
          status: 'completed',
          urgency: 'low',
          description: 'Completed diagnostic',
          completedAt: new Date(Date.now() - 3600000), // 1 hour ago
        }),
      ];
    });

    test('should display all jobs with status filtering', async () => {
      const { getByText } = render(<AdminJobsScreen />);

      await waitFor(() => {
        expect(getByText('Brake repair needed')).toBeTruthy();
        expect(getByText('Oil change in progress')).toBeTruthy();
        expect(getByText('Completed diagnostic')).toBeTruthy();
      });

      // Test status filtering
      const statusFilter = getByText('All Status');
      fireEvent.press(statusFilter);

      const pendingFilter = getByText('Pending');
      fireEvent.press(pendingFilter);

      await waitFor(() => {
        expect(getByText('Brake repair needed')).toBeTruthy();
        // Other statuses should be filtered out
      });
    });

    test('should allow admin to reassign jobs', async () => {
      const { getByText } = render(<AdminJobsScreen />);

      await waitFor(() => {
        expect(getByText('Oil change in progress')).toBeTruthy();
      });

      const reassignButton = getByText('Reassign');
      fireEvent.press(reassignButton);

      await waitFor(() => {
        expect(getByText('Reassign Job')).toBeTruthy();
      });

      const selectMechanicButton = getByText('Select Mechanic');
      fireEvent.press(selectMechanicButton);

      const mechanicOption = getByText('John Mechanic');
      fireEvent.press(mechanicOption);

      const confirmReassignButton = getByText('Confirm Reassignment');
      fireEvent.press(confirmReassignButton);

      await waitFor(() => {
        expect(mockAppStore.updateServiceRequest).toHaveBeenCalledWith('request-124', {
          mechanicId: expect.any(String),
          reassignedAt: expect.any(Date),
          reassignedBy: 'admin-123',
        });
      });
    });

    test('should handle emergency job escalation', async () => {
      mockAppStore.serviceRequests.push(
        createMockServiceRequest({
          id: 'request-126',
          status: 'pending',
          urgency: 'emergency',
          description: 'Car won\'t start - customer stranded',
          createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
        })
      );

      const { getByText } = render(<AdminJobsScreen />);

      await waitFor(() => {
        expect(getByText('Emergency Alert')).toBeTruthy();
        expect(getByText('Car won\'t start - customer stranded')).toBeTruthy();
      });

      const escalateButton = getByText('Escalate');
      fireEvent.press(escalateButton);

      await waitFor(() => {
        expect(getByText('Emergency Escalation')).toBeTruthy();
      });
    });

    test('should show job performance metrics', async () => {
      const { getByText } = render(<AdminJobsScreen />);

      await waitFor(() => {
        expect(getByText('Job Metrics')).toBeTruthy();
        expect(getByText('Avg Completion Time')).toBeTruthy();
        expect(getByText('Success Rate')).toBeTruthy();
      });
    });
  });

  describe('Quote Management', () => {
    beforeEach(() => {
      mockAppStore.quotes = [
        createMockQuote({
          id: 'quote-123',
          serviceRequestId: 'request-123',
          status: 'pending',
          totalCost: 150,
          description: 'Brake repair quote',
          createdAt: new Date(),
        }),
        createMockQuote({
          id: 'quote-124',
          serviceRequestId: 'request-124',
          status: 'accepted',
          totalCost: 75,
          description: 'Oil change quote',
          paidAt: new Date(),
        }),
        createMockQuote({
          id: 'quote-125',
          serviceRequestId: 'request-125',
          status: 'declined',
          totalCost: 200,
          description: 'Transmission repair quote',
        }),
      ];
    });

    test('should display all quotes with filtering and search', async () => {
      const { getByText, getByPlaceholderText } = render(<AdminQuotesScreen />);

      await waitFor(() => {
        expect(getByText('Brake repair quote')).toBeTruthy();
        expect(getByText('Oil change quote')).toBeTruthy();
        expect(getByText('Transmission repair quote')).toBeTruthy();
      });

      // Test search functionality
      const searchInput = getByPlaceholderText('Search quotes...');
      fireEvent.changeText(searchInput, 'brake');

      await waitFor(() => {
        expect(getByText('Brake repair quote')).toBeTruthy();
        // Other quotes should be filtered out
      });
    });

    test('should allow admin to approve disputed quotes', async () => {
      mockAppStore.quotes.push(
        createMockQuote({
          id: 'quote-126',
          status: 'disputed',
          totalCost: 300,
          description: 'Disputed engine repair quote',
          disputeReason: 'Customer thinks price is too high',
        })
      );

      const { getByText } = render(<AdminQuotesScreen />);

      await waitFor(() => {
        expect(getByText('Disputed engine repair quote')).toBeTruthy();
        expect(getByText('Disputed')).toBeTruthy();
      });

      const reviewButton = getByText('Review Dispute');
      fireEvent.press(reviewButton);

      await waitFor(() => {
        expect(getByText('Quote Dispute Review')).toBeTruthy();
        expect(getByText('Customer thinks price is too high')).toBeTruthy();
      });

      const approveButton = getByText('Approve Quote');
      fireEvent.press(approveButton);

      await waitFor(() => {
        expect(mockAppStore.updateQuote).toHaveBeenCalledWith('quote-126', {
          status: 'approved',
          approvedBy: 'admin-123',
          approvedAt: expect.any(Date),
        });
      });
    });

    test('should handle quote pricing validation', async () => {
      const { getByText } = render(<AdminQuotesScreen />);

      await waitFor(() => {
        expect(getByText('Brake repair quote')).toBeTruthy();
      });

      const validateButton = getByText('Validate Pricing');
      fireEvent.press(validateButton);

      await waitFor(() => {
        expect(getByText('Pricing Analysis')).toBeTruthy();
        expect(getByText('Market Rate: $140-$180')).toBeTruthy();
        expect(getByText('Quote: $150')).toBeTruthy();
        expect(getByText('Status: Within Range')).toBeTruthy();
      });
    });
  });

  describe('System Settings and Configuration', () => {
    test('should allow admin to modify system settings', async () => {
      const { getByText, getByPlaceholderText } = render(<AdminIndexScreen />);

      const settingsButton = getByText('System Settings');
      fireEvent.press(settingsButton);

      await waitFor(() => {
        expect(getByText('System Configuration')).toBeTruthy();
      });

      // Modify emergency response time
      const emergencyTimeInput = getByPlaceholderText('Emergency response time (minutes)');
      fireEvent.changeText(emergencyTimeInput, '15');

      // Modify service radius
      const serviceRadiusInput = getByPlaceholderText('Service radius (miles)');
      fireEvent.changeText(serviceRadiusInput, '25');

      const saveSettingsButton = getByText('Save Settings');
      fireEvent.press(saveSettingsButton);

      await waitFor(() => {
        expect(getByText('Settings Updated')).toBeTruthy();
      });
    });

    test('should manage pricing rules', async () => {
      const { getByText, getByPlaceholderText } = render(<AdminIndexScreen />);

      const pricingButton = getByText('Pricing Rules');
      fireEvent.press(pricingButton);

      await waitFor(() => {
        expect(getByText('Service Pricing')).toBeTruthy();
      });

      // Update oil change pricing
      const oilChangeBasePrice = getByPlaceholderText('Base price');
      fireEvent.changeText(oilChangeBasePrice, '55');

      const updatePricingButton = getByText('Update Pricing');
      fireEvent.press(updatePricingButton);

      await waitFor(() => {
        expect(getByText('Pricing Updated')).toBeTruthy();
      });
    });
  });

  describe('Reports and Analytics', () => {
    test('should generate revenue reports', async () => {
      mockAppStore.getRevenueStats.mockReturnValue({
        thisMonth: 12000,
        lastMonth: 10500,
        thisYear: 145000,
        lastYear: 120000,
        topServices: [
          { service: 'Oil Change', revenue: 3500 },
          { service: 'Brake Repair', revenue: 4200 },
        ],
      });

      const { getByText } = render(<AdminIndexScreen />);

      const reportsButton = getByText('Generate Reports');
      fireEvent.press(reportsButton);

      await waitFor(() => {
        expect(getByText('Revenue Report')).toBeTruthy();
        expect(getByText('$12,000')).toBeTruthy(); // This month
        expect(getByText('$145,000')).toBeTruthy(); // This year
        expect(getByText('Brake Repair - $4,200')).toBeTruthy();
      });
    });

    test('should show user engagement metrics', async () => {
      mockAppStore.getUserMetrics.mockReturnValue({
        activeCustomers: 85,
        newCustomers: 12,
        retentionRate: 78,
        averageJobsPerCustomer: 2.3,
      });

      const { getByText } = render(<AdminIndexScreen />);

      await waitFor(() => {
        expect(getByText('User Metrics')).toBeTruthy();
        expect(getByText('85 Active Customers')).toBeTruthy();
        expect(getByText('78% Retention Rate')).toBeTruthy();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle data loading failures', async () => {
      mockAppStore.getAllStats.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const { getByText } = render(<AdminIndexScreen />);

      await waitFor(() => {
        expect(getByText('Error Loading Data')).toBeTruthy();
        expect(getByText('Retry')).toBeTruthy();
      });

      const retryButton = getByText('Retry');
      fireEvent.press(retryButton);

      // Should attempt to reload data
      expect(mockAppStore.getAllStats).toHaveBeenCalledTimes(2);
    });

    test('should handle permission errors', async () => {
      mockAuthStore.user.role = 'customer'; // Non-admin user

      const { getByText } = render(<AdminIndexScreen />);

      await waitFor(() => {
        expect(getByText('Access Denied')).toBeTruthy();
        expect(getByText('You do not have admin privileges')).toBeTruthy();
      });
    });

    test('should validate admin actions', async () => {
      const { getByText } = render(<AdminUsersScreen />);

      // Try to delete the last admin
      mockAuthStore.getAllUsers.mockReturnValue([
        createMockUser({ id: 'admin-123', role: 'admin' }), // Only admin
      ]);

      await waitFor(() => {
        expect(getByText('admin@test.com')).toBeTruthy();
      });

      const deleteButton = getByText('Delete');
      fireEvent.press(deleteButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Cannot Delete User',
          'Cannot delete the last admin user',
          expect.any(Array)
        );
      });
    });
  });

  describe('Real-time Updates', () => {
    test('should show real-time job status updates', async () => {
      const { getByText, rerender } = render(<AdminJobsScreen />);

      await waitFor(() => {
        expect(getByText('Brake repair needed')).toBeTruthy();
        expect(getByText('Pending')).toBeTruthy();
      });

      // Simulate real-time update
      mockAppStore.serviceRequests[0].status = 'in_progress';
      rerender(<AdminJobsScreen />);

      await waitFor(() => {
        expect(getByText('In Progress')).toBeTruthy();
      });
    });

    test('should update dashboard metrics in real-time', async () => {
      const { getByText, rerender } = render(<AdminIndexScreen />);

      mockAppStore.getAllStats.mockReturnValue({
        totalJobs: 150,
        activeJobs: 25,
        completedJobs: 120,
      });

      await waitFor(() => {
        expect(getByText('150')).toBeTruthy();
        expect(getByText('25')).toBeTruthy();
      });

      // Simulate new job completion
      mockAppStore.getAllStats.mockReturnValue({
        totalJobs: 150,
        activeJobs: 24,
        completedJobs: 121,
      });

      rerender(<AdminIndexScreen />);

      await waitFor(() => {
        expect(getByText('24')).toBeTruthy();
        expect(getByText('121')).toBeTruthy();
      });
    });
  });
});