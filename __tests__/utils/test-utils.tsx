import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider } from '@/stores/StoreProvider';

// Mock initial state for stores
const mockInitialState = {
  auth: {
    user: null,
    isAuthenticated: false,
    isLoading: false,
  },
  settings: {
    theme: 'light',
    notifications: true,
  }
};

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <SafeAreaProvider initialMetrics={{
      frame: { x: 0, y: 0, width: 0, height: 0 },
      insets: { top: 0, left: 0, right: 0, bottom: 0 },
    }}>
      <StoreProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react-native';

// Override render method
export { customRender as render };

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'customer' as const,
  createdAt: new Date(),
  ...overrides,
});

export const createMockVehicle = (overrides = {}) => ({
  id: 'test-vehicle-id',
  customerId: 'test-customer-id',
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  vin: 'TEST123456789',
  color: 'Silver',
  mileage: 50000,
  vehicleType: 'car' as const,
  isPrimary: true,
  createdAt: new Date(),
  ...overrides,
});

export const createMockServiceRequest = (overrides = {}) => ({
  id: 'test-service-id',
  customerId: 'test-customer-id',
  vehicleId: 'test-vehicle-id',
  serviceType: 'Oil Change',
  description: 'Regular oil change service',
  urgency: 'medium' as const,
  status: 'pending' as const,
  estimatedCost: 75.00,
  createdAt: new Date(),
  ...overrides,
});

export const createMockQuote = (overrides = {}) => ({
  id: 'test-quote-id',
  serviceRequestId: 'test-service-id',
  laborCost: 100,
  partsCost: 50,
  travelCost: 25,
  totalCost: 175,
  estimatedDuration: 2,
  validUntil: new Date(Date.now() + 86400000),
  status: 'pending' as const,
  createdAt: new Date(),
  ...overrides,
});

// Async test helpers
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock navigation helpers
export const mockNavigationProps = {
  navigation: {
    navigate: jest.fn(),
    goBack: jest.fn(),
    replace: jest.fn(),
    push: jest.fn(),
    pop: jest.fn(),
    setOptions: jest.fn(),
  },
  route: {
    params: {},
    name: 'TestScreen',
    key: 'test-key',
  },
};

// Environment setup helpers
export const setupTestEnvironment = () => {
  // Mock AsyncStorage
  const mockAsyncStorage = {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
  };

  require('@react-native-async-storage/async-storage').default = mockAsyncStorage;
  
  return {
    mockAsyncStorage,
  };
};

// Network mock helpers
export const mockFetch = (response: any, status = 200) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
    })
  ) as jest.Mock;
};

// Error boundary for testing
export const TestErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};