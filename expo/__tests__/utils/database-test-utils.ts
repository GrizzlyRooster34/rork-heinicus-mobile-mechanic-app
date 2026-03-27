import AsyncStorage from '@react-native-async-storage/async-storage';
import { mobileDB } from '@/lib/mobile-database';

/**
 * Database test utilities for mobile AsyncStorage testing
 */

export const setupDatabaseTests = () => {
  const mockAsyncStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    getAllKeys: jest.fn(),
    multiGet: jest.fn(),
    multiSet: jest.fn(),
    multiRemove: jest.fn(),
  };

  // Mock AsyncStorage
  (AsyncStorage.getItem as jest.Mock) = mockAsyncStorage.getItem;
  (AsyncStorage.setItem as jest.Mock) = mockAsyncStorage.setItem;
  (AsyncStorage.removeItem as jest.Mock) = mockAsyncStorage.removeItem;
  (AsyncStorage.clear as jest.Mock) = mockAsyncStorage.clear;

  return {
    mockAsyncStorage,
    clearMocks: () => {
      Object.values(mockAsyncStorage).forEach(mock => mock.mockClear());
    },
  };
};

export const mockDatabaseInitialized = (mockAsyncStorage: any) => {
  mockAsyncStorage.getItem.mockImplementation((key: string) => {
    if (key === '@heinicus/db_initialized') return Promise.resolve('true');
    if (key === '@heinicus/db_version') return Promise.resolve('1.0.0');
    if (key === '@heinicus/users') return Promise.resolve(JSON.stringify([]));
    if (key === '@heinicus/vehicles') return Promise.resolve(JSON.stringify([]));
    return Promise.resolve(null);
  });
};

export const mockDatabaseEmpty = (mockAsyncStorage: any) => {
  mockAsyncStorage.getItem.mockResolvedValue(null);
};

export const createTestUsers = () => [
  {
    id: 'test-admin',
    email: 'admin@test.com',
    password: 'admin123!',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'test-customer',
    email: 'customer@test.com',
    password: 'customer123!',
    firstName: 'Customer',
    lastName: 'User', 
    role: 'CUSTOMER',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export const createTestVehicles = () => [
  {
    id: 'test-vehicle-1',
    customerId: 'test-customer',
    make: 'Honda',
    model: 'Civic',
    year: 2020,
    vin: 'TEST123456789',
    color: 'Blue',
    mileage: 25000,
    vehicleType: 'CAR',
    isPrimary: true,
    createdAt: new Date().toISOString(),
  },
];

export const expectDatabaseOperation = async (
  operation: () => Promise<any>,
  expectedAsyncStorageCalls: string[]
) => {
  await operation();
  
  expectedAsyncStorageCalls.forEach(call => {
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      call,
      expect.any(String)
    );
  });
};

export const clearDatabase = async () => {
  await mobileDB.clearDatabase();
};