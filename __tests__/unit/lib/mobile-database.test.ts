import AsyncStorage from '@react-native-async-storage/async-storage';
import { mobileDB } from '@/lib/mobile-database';
import { 
  setupDatabaseTests, 
  mockDatabaseEmpty, 
  mockDatabaseInitialized,
  createTestUsers,
  createTestVehicles,
  expectDatabaseOperation,
} from '../../utils/database-test-utils';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock database initialization
jest.mock('@/scripts/init-database', () => ({
  initializeDatabase: jest.fn().mockResolvedValue({
    users: [],
    customerProfiles: [],
    mechanicProfiles: [],
    adminProfiles: [],
    vehicles: [],
  }),
}));

describe('MobileDatabase', () => {
  let mockAsyncStorage: any;

  beforeEach(() => {
    const setup = setupDatabaseTests();
    mockAsyncStorage = setup.mockAsyncStorage;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize database on first run', async () => {
      mockDatabaseEmpty(mockAsyncStorage);
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      await mobileDB.initializeIfNeeded();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@heinicus/db_initialized');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@heinicus/db_initialized', 'true');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@heinicus/db_version', '1.0.0');
    });

    test('should skip initialization if already initialized', async () => {
      mockDatabaseInitialized(mockAsyncStorage);

      await mobileDB.initializeIfNeeded();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@heinicus/db_initialized');
      expect(AsyncStorage.setItem).not.toHaveBeenCalledWith('@heinicus/db_initialized', 'true');
    });

    test('should handle initialization timeout', async () => {
      mockAsyncStorage.getItem.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(null), 6000))
      );

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await mobileDB.initializeIfNeeded();

      expect(consoleSpy).toHaveBeenCalledWith('Database initialization timed out');
      consoleSpy.mockRestore();
    });

    test('should handle initialization errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await mobileDB.initializeIfNeeded();

      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ Failed to initialize mobile database:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('User Operations', () => {
    beforeEach(() => {
      const testUsers = createTestUsers();
      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === '@heinicus/users') {
          return Promise.resolve(JSON.stringify(testUsers));
        }
        return Promise.resolve(null);
      });
    });

    test('should get all users', async () => {
      const users = await mobileDB.getUsers();

      expect(users).toHaveLength(2);
      expect(users[0].email).toBe('admin@test.com');
      expect(users[1].email).toBe('customer@test.com');
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@heinicus/users');
    });

    test('should authenticate valid user', async () => {
      const user = await mobileDB.authenticateUser('admin@test.com', 'admin123!');

      expect(user).toBeTruthy();
      expect(user?.email).toBe('admin@test.com');
      expect(user?.role).toBe('ADMIN');
      expect(user).not.toHaveProperty('password'); // Password should be removed
    });

    test('should reject invalid credentials', async () => {
      const user = await mobileDB.authenticateUser('admin@test.com', 'wrongpassword');

      expect(user).toBeNull();
    });

    test('should reject non-existent user', async () => {
      const user = await mobileDB.authenticateUser('nonexistent@test.com', 'password');

      expect(user).toBeNull();
    });

    test('should create new user', async () => {
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const userData = {
        email: 'newuser@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: 'customer' as const,
        isActive: true,
      };

      const user = await mobileDB.createUser(userData);

      expect(user).toBeTruthy();
      expect(user?.email).toBe('newuser@test.com');
      expect(user?.firstName).toBe('New');
      expect(user).not.toHaveProperty('password');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@heinicus/users',
        expect.any(String)
      );
    });

    test('should prevent duplicate user creation', async () => {
      const userData = {
        email: 'admin@test.com', // Already exists
        password: 'password123',
        firstName: 'Duplicate',
        lastName: 'User',
        role: 'customer' as const,
        isActive: true,
      };

      const user = await mobileDB.createUser(userData);

      expect(user).toBeNull();
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    test('should handle user operation errors', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const users = await mobileDB.getUsers();

      expect(users).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error getting users:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Vehicle Operations', () => {
    beforeEach(() => {
      const testVehicles = createTestVehicles();
      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === '@heinicus/vehicles') {
          return Promise.resolve(JSON.stringify(testVehicles));
        }
        return Promise.resolve(null);
      });
    });

    test('should get vehicles for customer', async () => {
      const vehicles = await mobileDB.getVehiclesForCustomer('test-customer');

      expect(vehicles).toHaveLength(1);
      expect(vehicles[0].customerId).toBe('test-customer');
      expect(vehicles[0].make).toBe('Honda');
    });

    test('should return empty array for non-existent customer', async () => {
      const vehicles = await mobileDB.getVehiclesForCustomer('non-existent');

      expect(vehicles).toEqual([]);
    });

    test('should add new vehicle', async () => {
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const vehicleData = {
        customerId: 'test-customer',
        make: 'Toyota',
        model: 'Prius',
        year: 2021,
        vehicleType: 'car' as const,
        mileage: 0,
        isPrimary: false,
      };

      const vehicle = await mobileDB.addVehicle(vehicleData);

      expect(vehicle).toBeTruthy();
      expect(vehicle?.make).toBe('Toyota');
      expect(vehicle?.model).toBe('Prius');
      expect(vehicle?.id).toMatch(/^vehicle-/);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@heinicus/vehicles',
        expect.any(String)
      );
    });

    test('should update vehicle', async () => {
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const updates = { mileage: 30000, color: 'Red' };
      const success = await mobileDB.updateVehicle('test-vehicle-1', updates);

      expect(success).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@heinicus/vehicles',
        expect.any(String)
      );
    });

    test('should handle vehicle operation errors', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const vehicles = await mobileDB.getVehiclesForCustomer('test-customer');

      expect(vehicles).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error getting vehicles:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Database Management', () => {
    test('should clear database', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue(undefined);

      await mobileDB.clearDatabase();

      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(9);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@heinicus/users');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@heinicus/vehicles');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@heinicus/db_initialized');
    });

    test('should get database status', async () => {
      const testUsers = createTestUsers();
      const testVehicles = createTestVehicles();

      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        switch (key) {
          case '@heinicus/db_initialized':
            return Promise.resolve('true');
          case '@heinicus/db_version':
            return Promise.resolve('1.0.0');
          case '@heinicus/users':
            return Promise.resolve(JSON.stringify(testUsers));
          case '@heinicus/vehicles':
            return Promise.resolve(JSON.stringify(testVehicles));
          default:
            return Promise.resolve(null);
        }
      });

      const status = await mobileDB.getDatabaseStatus();

      expect(status.isInitialized).toBe(true);
      expect(status.version).toBe('1.0.0');
      expect(status.userCount).toBe(2);
      expect(status.vehicleCount).toBe(1);
      expect(status.adminUsers).toBe(1);
      expect(status.customerUsers).toBe(1);
    });

    test('should handle database status errors', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const status = await mobileDB.getDatabaseStatus();

      expect(status.isInitialized).toBe(false);
      expect(status.version).toBe('error');
      expect(status.userCount).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error getting database status:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });
});