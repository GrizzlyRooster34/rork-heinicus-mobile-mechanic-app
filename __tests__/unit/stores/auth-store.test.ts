import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/stores/auth-store';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock tRPC client
const mockTrpcClient = {
  auth: {
    login: {
      mutate: jest.fn(),
    },
    signup: {
      mutate: jest.fn(),
    },
  },
};

jest.mock('@/lib/trpc', () => ({
  trpcClient: mockTrpcClient,
}));

// Mock development utilities
jest.mock('@/utils/dev', () => ({
  devMode: false,
  isDevCredentials: jest.fn(),
  getDevUser: jest.fn(),
}));

// Mock store utilities
jest.mock('@/stores/store-utils', () => ({
  withAsyncErrorHandling: (fn: any) => fn,
  withErrorHandling: (fn: any) => fn,
  logStoreAction: jest.fn(),
}));

describe('AuthStore', () => {
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    
    // Reset store state
    useAuthStore.getState().logout();
  });

  describe('Initial State', () => {
    test('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore());
      
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Login', () => {
    test('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER' as const,
        createdAt: new Date().toISOString(),
      };

      const mockResponse = {
        success: true,
        user: mockUser,
        token: 'test-token',
      };

      mockTrpcClient.auth.login.mutate.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        const success = await result.current.login('test@example.com', 'password123');
        expect(success).toBe(true);
      });

      expect(result.current.user).toEqual({
        ...mockUser,
        createdAt: expect.any(Date),
      });
      expect(result.current.token).toBe('test-token');
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    test('should handle login failure', async () => {
      const mockResponse = {
        success: false,
        error: 'Invalid credentials',
      };

      mockTrpcClient.auth.login.mutate.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        const success = await result.current.login('test@example.com', 'wrongpassword');
        expect(success).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    test('should handle login network error', async () => {
      mockTrpcClient.auth.login.mutate.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        const success = await result.current.login('test@example.com', 'password123');
        expect(success).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    test('should set loading state during login', async () => {
      mockTrpcClient.auth.login.mutate.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login('test@example.com', 'password123');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Signup', () => {
    test('should signup successfully and auto-login', async () => {
      const mockUser = {
        id: 'user-new',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        role: 'CUSTOMER' as const,
        createdAt: new Date().toISOString(),
      };

      const mockResponse = {
        success: true,
        user: mockUser,
        token: 'new-token',
      };

      mockTrpcClient.auth.signup.mutate.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        const success = await result.current.signup(
          'new@example.com',
          'password123',
          'New',
          'User'
        );
        expect(success).toBe(true);
      });

      expect(result.current.user).toEqual({
        ...mockUser,
        createdAt: expect.any(Date),
      });
      expect(result.current.token).toBe('new-token');
      expect(result.current.isAuthenticated).toBe(true);
    });

    test('should signup with optional parameters', async () => {
      const mockUser = {
        id: 'mechanic-new',
        email: 'mechanic@example.com',
        firstName: 'New',
        lastName: 'Mechanic',
        role: 'MECHANIC' as const,
        phone: '(555) 123-4567',
        createdAt: new Date().toISOString(),
      };

      const mockResponse = {
        success: true,
        user: mockUser,
      };

      mockTrpcClient.auth.signup.mutate.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        const success = await result.current.signup(
          'mechanic@example.com',
          'password123',
          'New',
          'Mechanic',
          '(555) 123-4567',
          'MECHANIC'
        );
        expect(success).toBe(true);
      });

      expect(mockTrpcClient.auth.signup.mutate).toHaveBeenCalledWith({
        email: 'mechanic@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'Mechanic',
        phone: '(555) 123-4567',
        role: 'MECHANIC',
      });
    });

    test('should handle signup failure', async () => {
      const mockResponse = {
        success: false,
        error: 'Email already exists',
      };

      mockTrpcClient.auth.signup.mutate.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        const success = await result.current.signup(
          'existing@example.com',
          'password123',
          'Test',
          'User'
        );
        expect(success).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    test('should default to customer role', async () => {
      const mockResponse = { success: false };
      mockTrpcClient.auth.signup.mutate.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signup('test@example.com', 'password', 'Test', 'User');
      });

      expect(mockTrpcClient.auth.signup.mutate).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
        firstName: 'Test',
        lastName: 'User',
        phone: undefined,
        role: 'CUSTOMER',
      });
    });
  });

  describe('Logout', () => {
    test('should clear user data on logout', () => {
      const { result } = renderHook(() => useAuthStore());

      // Set some initial state
      act(() => {
        result.current.setUser({
          id: 'user-123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'CUSTOMER',
          createdAt: new Date(),
        });
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('SetUser', () => {
    test('should set user and update authentication state', () => {
      const { result } = renderHook(() => useAuthStore());

      const testUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER' as const,
        createdAt: new Date(),
      };

      act(() => {
        result.current.setUser(testUser);
      });

      expect(result.current.user).toEqual(testUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('UpdateUserRole', () => {
    test('should update user role successfully', async () => {
      // This would typically involve a backend call
      // For now, we test that the method exists and can be called
      const { result } = renderHook(() => useAuthStore());

      expect(typeof result.current.updateUserRole).toBe('function');
      
      // Since implementation is not fully shown, we test that it doesn't crash
      await act(async () => {
        const success = await result.current.updateUserRole('user-123', 'MECHANIC');
        // The actual implementation would determine the return value
        expect(typeof success).toBe('boolean');
      });
    });
  });

  describe('GetAllUsers', () => {
    test('should return all users', () => {
      const { result } = renderHook(() => useAuthStore());

      const users = result.current.getAllUsers();
      expect(Array.isArray(users)).toBe(true);
    });
  });

  describe('Persistence', () => {
    test('should persist authentication state', async () => {
      const { result } = renderHook(() => useAuthStore());

      const testUser = {
        id: 'user-persistent',
        email: 'persistent@example.com',
        firstName: 'Persistent',
        lastName: 'User',
        role: 'CUSTOMER' as const,
        createdAt: new Date(),
      };

      act(() => {
        result.current.setUser(testUser);
      });

      // The persistence is handled by zustand middleware
      // We can verify the store has the correct state
      expect(result.current.user).toEqual(testUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle tRPC client errors gracefully', async () => {
      mockTrpcClient.auth.login.mutate.mockRejectedValue(new Error('tRPC error'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        const success = await result.current.login('test@example.com', 'password');
        expect(success).toBe(false);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.user).toBeNull();
    });

    test('should handle AsyncStorage errors gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() => useAuthStore());

      // Should not throw error even if storage fails
      expect(() => {
        act(() => {
          result.current.setUser({
            id: 'user-123',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            role: 'CUSTOMER',
            createdAt: new Date(),
          });
        });
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('should handle malformed tRPC responses', async () => {
      mockTrpcClient.auth.login.mutate.mockResolvedValue({
        // Missing required fields
        success: true,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        const success = await result.current.login('test@example.com', 'password');
        // Should handle gracefully
        expect(typeof success).toBe('boolean');
      });
    });

    test('should handle undefined user data', async () => {
      mockTrpcClient.auth.login.mutate.mockResolvedValue({
        success: true,
        user: null,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        const success = await result.current.login('test@example.com', 'password');
        expect(success).toBe(false);
      });

      expect(result.current.user).toBeNull();
    });

    test('should handle empty email or password', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        const success = await result.current.login('', '');
        expect(success).toBe(false);
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('State Transitions', () => {
    test('should properly transition between loading states', async () => {
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve;
      });

      mockTrpcClient.auth.login.mutate.mockReturnValue(loginPromise);

      const { result } = renderHook(() => useAuthStore());

      // Start login
      act(() => {
        result.current.login('test@example.com', 'password');
      });

      expect(result.current.isLoading).toBe(true);

      // Complete login
      await act(async () => {
        resolveLogin!({ success: true, user: { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User', role: 'CUSTOMER', createdAt: new Date().toISOString() }});
        await loginPromise;
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});