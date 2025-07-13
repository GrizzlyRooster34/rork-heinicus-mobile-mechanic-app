import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AuthScreen from '@/app/auth/index';
import { render, setupTestEnvironment } from '../../utils/test-utils';
import { mobileDB } from '@/lib/mobile-database';

// Mock router
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    replace: mockReplace,
  },
}));

// Mock mobile database
jest.mock('@/lib/mobile-database', () => ({
  mobileDB: {
    authenticateUser: jest.fn(),
    createUser: jest.fn(),
  },
}));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

const mockMobileDB = mobileDB as jest.Mocked<typeof mobileDB>;

describe('Login Workflow Integration', () => {
  beforeEach(() => {
    setupTestEnvironment();
    jest.clearAllMocks();
    mockReplace.mockClear();
  });

  describe('Customer Login Flow', () => {
    test('should complete successful customer login workflow', async () => {
      const mockCustomer = {
        id: 'customer-123',
        email: 'customer@test.com',
        firstName: 'Test',
        lastName: 'Customer',
        role: 'customer' as const,
        createdAt: new Date(),
      };

      mockMobileDB.authenticateUser.mockResolvedValue(mockCustomer);

      const { getByPlaceholderText, getByText } = render(<AuthScreen />);

      // Fill in login form
      const emailInput = getByPlaceholderText('john@example.com');
      const passwordInput = getByPlaceholderText('Enter your password');
      const signInButton = getByText('Sign In');

      fireEvent.changeText(emailInput, 'customer@test.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(signInButton);

      // Wait for authentication
      await waitFor(() => {
        expect(mockMobileDB.authenticateUser).toHaveBeenCalledWith(
          'customer@test.com',
          'password123'
        );
      });

      // Should redirect to customer dashboard
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/(customer)');
      });
    });

    test('should handle failed customer login', async () => {
      mockMobileDB.authenticateUser.mockResolvedValue(null);

      const { getByPlaceholderText, getByText } = render(<AuthScreen />);

      const emailInput = getByPlaceholderText('john@example.com');
      const passwordInput = getByPlaceholderText('Enter your password');
      const signInButton = getByText('Sign In');

      fireEvent.changeText(emailInput, 'customer@test.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Login Failed',
          'Invalid email or password. Please try again.'
        );
      });

      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe('Mechanic Login Flow', () => {
    test('should complete successful mechanic login workflow', async () => {
      const mockMechanic = {
        id: 'mechanic-123',
        email: 'mechanic@test.com',
        firstName: 'Test',
        lastName: 'Mechanic',
        role: 'mechanic' as const,
        createdAt: new Date(),
      };

      mockMobileDB.authenticateUser.mockResolvedValue(mockMechanic);

      const { getByPlaceholderText, getByText } = render(<AuthScreen />);

      const emailInput = getByPlaceholderText('john@example.com');
      const passwordInput = getByPlaceholderText('Enter your password');
      const signInButton = getByText('Sign In');

      fireEvent.changeText(emailInput, 'mechanic@test.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(mockMobileDB.authenticateUser).toHaveBeenCalledWith(
          'mechanic@test.com',
          'password123'
        );
      });

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/(mechanic)');
      });
    });
  });

  describe('Admin Login Flow', () => {
    test('should complete successful admin login workflow', async () => {
      const mockAdmin = {
        id: 'admin-123',
        email: 'admin@test.com',
        firstName: 'Test',
        lastName: 'Admin',
        role: 'admin' as const,
        createdAt: new Date(),
      };

      mockMobileDB.authenticateUser.mockResolvedValue(mockAdmin);

      const { getByPlaceholderText, getByText } = render(<AuthScreen />);

      const emailInput = getByPlaceholderText('john@example.com');
      const passwordInput = getByPlaceholderText('Enter your password');
      const signInButton = getByText('Sign In');

      fireEvent.changeText(emailInput, 'admin@test.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(mockMobileDB.authenticateUser).toHaveBeenCalledWith(
          'admin@test.com',
          'password123'
        );
      });

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/(admin)');
      });
    });
  });

  describe('Form Validation', () => {
    test('should show error for empty fields', async () => {
      const { getByText } = render(<AuthScreen />);

      const signInButton = getByText('Sign In');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Please fill in all required fields'
        );
      });

      expect(mockMobileDB.authenticateUser).not.toHaveBeenCalled();
    });

    test('should show error for invalid email in signup', async () => {
      const { getByText, getByPlaceholderText } = render(<AuthScreen />);

      // Switch to signup mode
      const switchModeButton = getByText("Don't have an account? Create one");
      fireEvent.press(switchModeButton);

      // Fill invalid email
      const emailInput = getByPlaceholderText('john@example.com');
      const passwordInput = getByPlaceholderText('Create a password (min 6 characters)');
      const firstNameInput = getByPlaceholderText('John');
      const lastNameInput = getByPlaceholderText('Doe');
      const createAccountButton = getByText('Create Account');

      fireEvent.changeText(firstNameInput, 'Test');
      fireEvent.changeText(lastNameInput, 'User');
      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(createAccountButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Please enter a valid email address'
        );
      });
    });

    test('should show error for weak password in signup', async () => {
      const { getByText, getByPlaceholderText } = render(<AuthScreen />);

      // Switch to signup mode
      const switchModeButton = getByText("Don't have an account? Create one");
      fireEvent.press(switchModeButton);

      // Fill weak password
      const emailInput = getByPlaceholderText('john@example.com');
      const passwordInput = getByPlaceholderText('Create a password (min 6 characters)');
      const firstNameInput = getByPlaceholderText('John');
      const lastNameInput = getByPlaceholderText('Doe');
      const createAccountButton = getByText('Create Account');

      fireEvent.changeText(firstNameInput, 'Test');
      fireEvent.changeText(lastNameInput, 'User');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, '123'); // Too short
      fireEvent.press(createAccountButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Password must be at least 6 characters long'
        );
      });
    });
  });

  describe('Sign Up Flow', () => {
    test('should complete successful customer signup workflow', async () => {
      const mockNewCustomer = {
        id: 'new-customer-123',
        email: 'newcustomer@test.com',
        firstName: 'New',
        lastName: 'Customer',
        role: 'customer' as const,
        createdAt: new Date(),
      };

      mockMobileDB.createUser.mockResolvedValue(mockNewCustomer);

      const { getByText, getByPlaceholderText } = render(<AuthScreen />);

      // Switch to signup mode
      const switchModeButton = getByText("Don't have an account? Create one");
      fireEvent.press(switchModeButton);

      // Fill signup form
      const firstNameInput = getByPlaceholderText('John');
      const lastNameInput = getByPlaceholderText('Doe');
      const emailInput = getByPlaceholderText('john@example.com');
      const passwordInput = getByPlaceholderText('Create a password (min 6 characters)');
      const createAccountButton = getByText('Create Account');

      fireEvent.changeText(firstNameInput, 'New');
      fireEvent.changeText(lastNameInput, 'Customer');
      fireEvent.changeText(emailInput, 'newcustomer@test.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(createAccountButton);

      await waitFor(() => {
        expect(mockMobileDB.createUser).toHaveBeenCalledWith({
          email: 'newcustomer@test.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'Customer',
          phone: undefined,
          role: 'customer',
          isActive: true,
        });
      });

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/(customer)');
      });
    });

    test('should handle failed signup', async () => {
      mockMobileDB.createUser.mockResolvedValue(null);

      const { getByText, getByPlaceholderText } = render(<AuthScreen />);

      // Switch to signup mode
      const switchModeButton = getByText("Don't have an account? Create one");
      fireEvent.press(switchModeButton);

      // Fill signup form
      const firstNameInput = getByPlaceholderText('John');
      const lastNameInput = getByPlaceholderText('Doe');
      const emailInput = getByPlaceholderText('john@example.com');
      const passwordInput = getByPlaceholderText('Create a password (min 6 characters)');
      const createAccountButton = getByText('Create Account');

      fireEvent.changeText(firstNameInput, 'Existing');
      fireEvent.changeText(lastNameInput, 'User');
      fireEvent.changeText(emailInput, 'existing@test.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(createAccountButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Sign Up Failed',
          'An account with this email already exists. Please try logging in instead.'
        );
      });

      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    test('should show loading state during login', async () => {
      mockMobileDB.authenticateUser.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(null), 500))
      );

      const { getByPlaceholderText, getByText } = render(<AuthScreen />);

      const emailInput = getByPlaceholderText('john@example.com');
      const passwordInput = getByPlaceholderText('Enter your password');
      const signInButton = getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(signInButton);

      // Should show loading text
      await waitFor(() => {
        expect(getByText('Signing In...')).toBeTruthy();
      });

      // Wait for completion
      await waitFor(() => {
        expect(getByText('Sign In')).toBeTruthy();
      }, { timeout: 1000 });
    });
  });
});