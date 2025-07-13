/**
 * Mobile Database Manager
 * Provides a simple database-like interface using AsyncStorage
 * For Day 1 deployment without external database dependencies
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeDatabase, INITIAL_USERS, INITIAL_VEHICLES, INITIAL_CUSTOMER_PROFILES } from '../scripts/init-database';
import { User } from '@/types/auth';
import { Vehicle } from '@/types/service';

const STORAGE_KEYS = {
  USERS: '@heinicus/users',
  VEHICLES: '@heinicus/vehicles',
  CUSTOMER_PROFILES: '@heinicus/customer_profiles',
  MECHANIC_PROFILES: '@heinicus/mechanic_profiles',
  ADMIN_PROFILES: '@heinicus/admin_profiles',
  SERVICE_REQUESTS: '@heinicus/service_requests',
  QUOTES: '@heinicus/quotes',
  DB_INITIALIZED: '@heinicus/db_initialized',
  DB_VERSION: '@heinicus/db_version',
} as const;

const DB_VERSION = '1.0.0';

export class MobileDatabase {
  private static instance: MobileDatabase;
  
  static getInstance(): MobileDatabase {
    if (!MobileDatabase.instance) {
      MobileDatabase.instance = new MobileDatabase();
    }
    return MobileDatabase.instance;
  }

  /**
   * Initialize the mobile database with Day 1 data
   */
  async initializeIfNeeded(): Promise<void> {
    try {
      const isInitialized = await AsyncStorage.getItem(STORAGE_KEYS.DB_INITIALIZED);
      const currentVersion = await AsyncStorage.getItem(STORAGE_KEYS.DB_VERSION);
      
      if (!isInitialized || currentVersion !== DB_VERSION) {
        console.log('🔄 Initializing mobile database...');
        
        const initialData = await initializeDatabase();
        
        // Store initial data in AsyncStorage
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialData.users)),
          AsyncStorage.setItem(STORAGE_KEYS.CUSTOMER_PROFILES, JSON.stringify(initialData.customerProfiles)),
          AsyncStorage.setItem(STORAGE_KEYS.MECHANIC_PROFILES, JSON.stringify(initialData.mechanicProfiles)),
          AsyncStorage.setItem(STORAGE_KEYS.ADMIN_PROFILES, JSON.stringify(initialData.adminProfiles)),
          AsyncStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(initialData.vehicles)),
          AsyncStorage.setItem(STORAGE_KEYS.SERVICE_REQUESTS, JSON.stringify([])),
          AsyncStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify([])),
          AsyncStorage.setItem(STORAGE_KEYS.DB_INITIALIZED, 'true'),
          AsyncStorage.setItem(STORAGE_KEYS.DB_VERSION, DB_VERSION),
        ]);
        
        console.log('✅ Mobile database initialized successfully');
      } else {
        console.log('✅ Mobile database already initialized');
      }
    } catch (error) {
      console.error('❌ Failed to initialize mobile database:', error);
      throw error;
    }
  }

  /**
   * Get all users
   */
  async getUsers(): Promise<User[]> {
    try {
      const usersJson = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      return usersJson ? JSON.parse(usersJson) : [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  /**
   * Get user by email and password (for authentication)
   */
  async authenticateUser(email: string, password: string): Promise<User | null> {
    try {
      const users = await this.getUsers();
      const user = users.find(u => u.email === email && u.password === password);
      
      if (user) {
        // Convert to proper User type (remove password from response)
        const { password: _, ...userWithoutPassword } = user;
        return {
          ...userWithoutPassword,
          role: userWithoutPassword.role as 'customer' | 'mechanic' | 'admin'
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error authenticating user:', error);
      return null;
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: Omit<User, 'id' | 'createdAt'> & { password: string }): Promise<User | null> {
    try {
      const users = await this.getUsers();
      
      // Check if user with email already exists
      if (users.some(u => u.email === userData.email)) {
        throw new Error('User with this email already exists');
      }
      
      const newUser = {
        ...userData,
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
      };
      
      const updatedUsers = [...users, newUser];
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      return {
        ...userWithoutPassword,
        createdAt: new Date(userWithoutPassword.createdAt),
        role: userWithoutPassword.role as 'customer' | 'mechanic' | 'admin'
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  /**
   * Get all vehicles for a customer
   */
  async getVehiclesForCustomer(customerId: string): Promise<Vehicle[]> {
    try {
      const vehiclesJson = await AsyncStorage.getItem(STORAGE_KEYS.VEHICLES);
      const vehicles = vehiclesJson ? JSON.parse(vehiclesJson) : [];
      return vehicles.filter((v: any) => v.customerId === customerId);
    } catch (error) {
      console.error('Error getting vehicles:', error);
      return [];
    }
  }

  /**
   * Add a new vehicle
   */
  async addVehicle(vehicleData: Omit<Vehicle, 'id' | 'createdAt'>): Promise<Vehicle | null> {
    try {
      const vehiclesJson = await AsyncStorage.getItem(STORAGE_KEYS.VEHICLES);
      const vehicles = vehiclesJson ? JSON.parse(vehiclesJson) : [];
      
      const newVehicle = {
        ...vehicleData,
        id: `vehicle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
      };
      
      const updatedVehicles = [...vehicles, newVehicle];
      await AsyncStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(updatedVehicles));
      
      return {
        ...newVehicle,
        createdAt: new Date(newVehicle.createdAt),
      };
    } catch (error) {
      console.error('Error adding vehicle:', error);
      return null;
    }
  }

  /**
   * Update a vehicle
   */
  async updateVehicle(vehicleId: string, updates: Partial<Vehicle>): Promise<boolean> {
    try {
      const vehiclesJson = await AsyncStorage.getItem(STORAGE_KEYS.VEHICLES);
      const vehicles = vehiclesJson ? JSON.parse(vehiclesJson) : [];
      
      const updatedVehicles = vehicles.map((v: any) => 
        v.id === vehicleId ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v
      );
      
      await AsyncStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(updatedVehicles));
      return true;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      return false;
    }
  }

  /**
   * Clear all data (for development/testing)
   */
  async clearDatabase(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.USERS),
        AsyncStorage.removeItem(STORAGE_KEYS.VEHICLES),
        AsyncStorage.removeItem(STORAGE_KEYS.CUSTOMER_PROFILES),
        AsyncStorage.removeItem(STORAGE_KEYS.MECHANIC_PROFILES),
        AsyncStorage.removeItem(STORAGE_KEYS.ADMIN_PROFILES),
        AsyncStorage.removeItem(STORAGE_KEYS.SERVICE_REQUESTS),
        AsyncStorage.removeItem(STORAGE_KEYS.QUOTES),
        AsyncStorage.removeItem(STORAGE_KEYS.DB_INITIALIZED),
        AsyncStorage.removeItem(STORAGE_KEYS.DB_VERSION),
      ]);
      
      console.log('✅ Mobile database cleared');
    } catch (error) {
      console.error('❌ Error clearing database:', error);
      throw error;
    }
  }

  /**
   * Get database status
   */
  async getDatabaseStatus() {
    try {
      const [
        isInitialized,
        version,
        usersJson,
        vehiclesJson,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.DB_INITIALIZED),
        AsyncStorage.getItem(STORAGE_KEYS.DB_VERSION),
        AsyncStorage.getItem(STORAGE_KEYS.USERS),
        AsyncStorage.getItem(STORAGE_KEYS.VEHICLES),
      ]);

      const users = usersJson ? JSON.parse(usersJson) : [];
      const vehicles = vehiclesJson ? JSON.parse(vehiclesJson) : [];

      return {
        isInitialized: !!isInitialized,
        version: version || 'unknown',
        userCount: users.length,
        vehicleCount: vehicles.length,
        adminUsers: users.filter((u: any) => u.role === 'ADMIN').length,
        mechanicUsers: users.filter((u: any) => u.role === 'MECHANIC').length,
        customerUsers: users.filter((u: any) => u.role === 'CUSTOMER').length,
      };
    } catch (error) {
      console.error('Error getting database status:', error);
      return {
        isInitialized: false,
        version: 'error',
        userCount: 0,
        vehicleCount: 0,
        adminUsers: 0,
        mechanicUsers: 0,
        customerUsers: 0,
      };
    }
  }
}

// Export singleton instance
export const mobileDB = MobileDatabase.getInstance();