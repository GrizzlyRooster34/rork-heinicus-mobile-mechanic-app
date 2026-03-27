import { useAuthStore } from '@/stores/auth-store';

/**
 * Authentication test utilities
 */

export const createMockAuthStore = (initialState = {}) => {
  const defaultState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
    ...initialState,
  };

  return defaultState;
};

export const mockAuthenticatedUser = (role: 'customer' | 'mechanic' | 'admin' = 'customer') => ({
  id: `test-${role}-id`,
  email: `${role}@test.com`,
  firstName: 'Test',
  lastName: role.charAt(0).toUpperCase() + role.slice(1),
  role,
  createdAt: new Date(),
});

export const mockLoginSuccess = (mockAuth: any, user: any) => {
  mockAuth.login.mockResolvedValue(true);
  mockAuth.user = user;
  mockAuth.isAuthenticated = true;
  mockAuth.isLoading = false;
};

export const mockLoginFailure = (mockAuth: any) => {
  mockAuth.login.mockResolvedValue(false);
  mockAuth.user = null;
  mockAuth.isAuthenticated = false;
  mockAuth.isLoading = false;
};

export const mockSignupSuccess = (mockAuth: any, user: any) => {
  mockAuth.signup.mockResolvedValue(true);
  mockAuth.user = user;
  mockAuth.isAuthenticated = true;
  mockAuth.isLoading = false;
};

export const mockSignupFailure = (mockAuth: any) => {
  mockAuth.signup.mockResolvedValue(false);
  mockAuth.user = null;
  mockAuth.isAuthenticated = false;
  mockAuth.isLoading = false;
};

export const mockLogout = (mockAuth: any) => {
  mockAuth.logout.mockImplementation(() => {
    mockAuth.user = null;
    mockAuth.isAuthenticated = false;
    mockAuth.isLoading = false;
  });
};

// Mock auth store hook
export const mockUseAuthStore = (authState: any) => {
  jest.spyOn(require('@/stores/auth-store'), 'useAuthStore').mockReturnValue(authState);
};

// Validation test helpers
export const invalidEmails = [
  '',
  'invalid-email',
  '@example.com',
  'user@',
  'user@.com',
  'user name@example.com',
];

export const validEmails = [
  'user@example.com',
  'test.user@domain.co.uk',
  'admin+test@company.org',
];

export const invalidPasswords = [
  '',
  '123',
  '12345',
  'short',
];

export const validPasswords = [
  'password123',
  'MySecurePass!',
  'test123456',
];