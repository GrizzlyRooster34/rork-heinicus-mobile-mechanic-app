import AsyncStorage from '@react-native-async-storage/async-storage';
import { mobileDB } from '@/lib/mobile-database';
import { setupDatabaseTests, clearDatabase } from '../../utils/database-test-utils';

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

describe('User-Vehicle Workflow Integration', () => {
  let mockAsyncStorage: any;

  beforeEach(async () => {
    const setup = setupDatabaseTests();
    mockAsyncStorage = setup.mockAsyncStorage;
    jest.clearAllMocks();

    // Setup empty database
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe('Complete User-Vehicle Lifecycle', () => {
    test('should handle complete user registration and vehicle management workflow', async () => {
      // Step 1: Initialize database
      await mobileDB.initializeIfNeeded();
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@heinicus/db_initialized', 'true');

      // Step 2: Create new customer user
      const newCustomer = await mobileDB.createUser({
        email: 'customer@workflow.test',
        password: 'securepassword123',
        firstName: 'Workflow',
        lastName: 'Customer',
        phone: '(555) 123-4567',
        role: 'customer',
        isActive: true,
      });

      expect(newCustomer).toBeTruthy();
      expect(newCustomer?.email).toBe('customer@workflow.test');
      expect(newCustomer?.role).toBe('customer');
      expect(newCustomer).not.toHaveProperty('password');

      // Mock the user being stored
      const storedUsers = [
        {
          id: newCustomer!.id,
          email: 'customer@workflow.test',
          password: 'securepassword123',
          firstName: 'Workflow',
          lastName: 'Customer',
          phone: '(555) 123-4567',
          role: 'customer',
          isActive: true,
          createdAt: newCustomer!.createdAt.toISOString(),
        }
      ];

      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === '@heinicus/users') {
          return Promise.resolve(JSON.stringify(storedUsers));
        }
        if (key === '@heinicus/vehicles') {
          return Promise.resolve(JSON.stringify([]));
        }
        return Promise.resolve(null);
      });

      // Step 3: Authenticate the new user
      const authenticatedUser = await mobileDB.authenticateUser(
        'customer@workflow.test', 
        'securepassword123'
      );

      expect(authenticatedUser).toBeTruthy();
      expect(authenticatedUser?.email).toBe('customer@workflow.test');
      expect(authenticatedUser).not.toHaveProperty('password');

      // Step 4: Add first vehicle for the customer
      const firstVehicle = await mobileDB.addVehicle({
        customerId: newCustomer!.id,
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: 'TOYOTA123456789',
        color: 'Silver',
        mileage: 15000,
        vehicleType: 'car',
        isPrimary: true,
      });

      expect(firstVehicle).toBeTruthy();
      expect(firstVehicle?.make).toBe('Toyota');
      expect(firstVehicle?.isPrimary).toBe(true);

      // Mock vehicles being stored
      const storedVehicles = [
        {
          id: firstVehicle!.id,
          customerId: newCustomer!.id,
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          vin: 'TOYOTA123456789',
          color: 'Silver',
          mileage: 15000,
          vehicleType: 'car',
          isPrimary: true,
          createdAt: firstVehicle!.createdAt.toISOString(),
        }
      ];

      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === '@heinicus/users') {
          return Promise.resolve(JSON.stringify(storedUsers));
        }
        if (key === '@heinicus/vehicles') {
          return Promise.resolve(JSON.stringify(storedVehicles));
        }
        return Promise.resolve(null);
      });

      // Step 5: Retrieve customer vehicles
      const customerVehicles = await mobileDB.getVehiclesForCustomer(newCustomer!.id);

      expect(customerVehicles).toHaveLength(1);
      expect(customerVehicles[0].make).toBe('Toyota');
      expect(customerVehicles[0].isPrimary).toBe(true);

      // Step 6: Add second vehicle (non-primary)
      const secondVehicle = await mobileDB.addVehicle({
        customerId: newCustomer!.id,
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        vin: 'HONDA987654321',
        color: 'Blue',
        mileage: 8000,
        vehicleType: 'car',
        isPrimary: false,
      });

      expect(secondVehicle).toBeTruthy();
      expect(secondVehicle?.make).toBe('Honda');
      expect(secondVehicle?.isPrimary).toBe(false);

      // Update stored vehicles
      storedVehicles.push({
        id: secondVehicle!.id,
        customerId: newCustomer!.id,
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        vin: 'HONDA987654321',
        color: 'Blue',
        mileage: 8000,
        vehicleType: 'car',
        isPrimary: false,
        createdAt: secondVehicle!.createdAt.toISOString(),
      });

      // Step 7: Update first vehicle's mileage
      const updateSuccess = await mobileDB.updateVehicle(firstVehicle!.id, {
        mileage: 16500,
        color: 'Dark Silver',
      });

      expect(updateSuccess).toBe(true);

      // Step 8: Verify multiple vehicles for customer
      const allCustomerVehicles = await mobileDB.getVehiclesForCustomer(newCustomer!.id);

      expect(allCustomerVehicles).toHaveLength(2);
      
      const toyotaCamry = allCustomerVehicles.find(v => v.make === 'Toyota');
      const hondaCivic = allCustomerVehicles.find(v => v.make === 'Honda');

      expect(toyotaCamry).toBeTruthy();
      expect(hondaCivic).toBeTruthy();
      expect(toyotaCamry?.isPrimary).toBe(true);
      expect(hondaCivic?.isPrimary).toBe(false);
    });

    test('should handle multi-user vehicle isolation', async () => {
      // Create two customers
      const customer1 = await mobileDB.createUser({
        email: 'customer1@test.com',
        password: 'password123',
        firstName: 'Customer',
        lastName: 'One',
        role: 'customer',
        isActive: true,
      });

      const customer2 = await mobileDB.createUser({
        email: 'customer2@test.com',
        password: 'password123',
        firstName: 'Customer',
        lastName: 'Two',
        role: 'customer',
        isActive: true,
      });

      expect(customer1).toBeTruthy();
      expect(customer2).toBeTruthy();

      // Mock stored users
      const storedUsers = [
        {
          id: customer1!.id,
          email: 'customer1@test.com',
          password: 'password123',
          firstName: 'Customer',
          lastName: 'One',
          role: 'customer',
          isActive: true,
          createdAt: customer1!.createdAt.toISOString(),
        },
        {
          id: customer2!.id,
          email: 'customer2@test.com', 
          password: 'password123',
          firstName: 'Customer',
          lastName: 'Two',
          role: 'customer',
          isActive: true,
          createdAt: customer2!.createdAt.toISOString(),
        }
      ];

      // Add vehicles for each customer
      const customer1Vehicle = await mobileDB.addVehicle({
        customerId: customer1!.id,
        make: 'Ford',
        model: 'F-150',
        year: 2022,
        vehicleType: 'truck',
        isPrimary: true,
      } as any);

      const customer2Vehicle = await mobileDB.addVehicle({
        customerId: customer2!.id,
        make: 'Tesla',
        model: 'Model 3',
        year: 2023,
        vehicleType: 'car',
        isPrimary: true,
      } as any);

      // Mock stored vehicles
      const storedVehicles = [
        {
          id: customer1Vehicle!.id,
          customerId: customer1!.id,
          make: 'Ford',
          model: 'F-150',
          year: 2022,
          vehicleType: 'truck',
          isPrimary: true,
          createdAt: customer1Vehicle!.createdAt.toISOString(),
        },
        {
          id: customer2Vehicle!.id,
          customerId: customer2!.id,
          make: 'Tesla',
          model: 'Model 3',
          year: 2023,
          vehicleType: 'car',
          isPrimary: true,
          createdAt: customer2Vehicle!.createdAt.toISOString(),
        }
      ];

      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === '@heinicus/users') {
          return Promise.resolve(JSON.stringify(storedUsers));
        }
        if (key === '@heinicus/vehicles') {
          return Promise.resolve(JSON.stringify(storedVehicles));
        }
        return Promise.resolve(null);
      });

      // Verify vehicle isolation
      const customer1Vehicles = await mobileDB.getVehiclesForCustomer(customer1!.id);
      const customer2Vehicles = await mobileDB.getVehiclesForCustomer(customer2!.id);

      expect(customer1Vehicles).toHaveLength(1);
      expect(customer2Vehicles).toHaveLength(1);

      expect(customer1Vehicles[0].make).toBe('Ford');
      expect(customer2Vehicles[0].make).toBe('Tesla');

      // Verify no cross-contamination
      expect(customer1Vehicles[0].customerId).toBe(customer1!.id);
      expect(customer2Vehicles[0].customerId).toBe(customer2!.id);
    });
  });

  describe('Error Handling in Workflows', () => {
    test('should handle storage failures gracefully during workflow', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Simulate storage failure during user creation
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage full'));

      const user = await mobileDB.createUser({
        email: 'test@fail.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'customer',
        isActive: true,
      });

      expect(user).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Error creating user:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    test('should handle corrupted data gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock corrupted user data
      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === '@heinicus/users') {
          return Promise.resolve('invalid json');
        }
        return Promise.resolve(null);
      });

      const users = await mobileDB.getUsers();

      expect(users).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error getting users:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('Database Status Integration', () => {
    test('should accurately report database status throughout workflow', async () => {
      // Initial status - empty database
      let status = await mobileDB.getDatabaseStatus();
      expect(status.isInitialized).toBe(false);
      expect(status.userCount).toBe(0);
      expect(status.vehicleCount).toBe(0);

      // After initialization
      await mobileDB.initializeIfNeeded();
      
      // Mock initialized state
      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === '@heinicus/db_initialized') return Promise.resolve('true');
        if (key === '@heinicus/db_version') return Promise.resolve('1.0.0');
        if (key === '@heinicus/users') return Promise.resolve(JSON.stringify([]));
        if (key === '@heinicus/vehicles') return Promise.resolve(JSON.stringify([]));
        return Promise.resolve(null);
      });

      status = await mobileDB.getDatabaseStatus();
      expect(status.isInitialized).toBe(true);
      expect(status.version).toBe('1.0.0');
      expect(status.userCount).toBe(0);
      expect(status.vehicleCount).toBe(0);
    });
  });
});