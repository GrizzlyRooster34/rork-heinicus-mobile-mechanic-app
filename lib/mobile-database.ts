/**
 * Mobile Database Manager
 * Provides a simple database-like interface using AsyncStorage
 * For Day 1 deployment without external database dependencies
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeDatabase, INITIAL_USERS, INITIAL_VEHICLES, INITIAL_CUSTOMER_PROFILES } from '../scripts/init-database';
import { User } from '@/types/auth';
import { Vehicle } from '@/types/service';
import { hashPassword, verifyPassword, isBcryptHash } from '@/utils/password';

// Internal database User type that includes password for authentication
type StoredUser = User & { password: string };

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
    return new Promise(async (resolve, reject) => {
      // 5 second timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.warn('Database initialization timed out');
        resolve();
      }, 5000);

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
      
      clearTimeout(timeout);
      resolve();
    } catch (error) {
      console.error('❌ Failed to initialize mobile database:', error);
      clearTimeout(timeout);
      resolve(); // Don't block app startup on database errors
    }
    });
  }

  /**
   * Get all users (internal - includes passwords)
   */
  private async getStoredUsers(): Promise<StoredUser[]> {
    try {
      const usersJson = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      return usersJson ? JSON.parse(usersJson) : [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  /**
   * Get all users (public - excludes passwords)
   */
  async getUsers(): Promise<User[]> {
    try {
      const storedUsers = await this.getStoredUsers();
      return storedUsers.map(({ password, ...user }) => user as User);
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
      const users = await this.getStoredUsers();
      const user = users.find(u => u.email === email);

      if (!user) {
        return null;
      }

      // Check if password is hashed (bcrypt) or plain text (for migration)
      let isValidPassword = false;

      if (isBcryptHash(user.password)) {
        // Verify against bcrypt hash
        isValidPassword = await verifyPassword(password, user.password);
      } else {
        // Legacy plain text comparison (for backward compatibility during migration)
        console.warn('User has plain text password, migrating to bcrypt...', email);
        isValidPassword = user.password === password;

        // If authentication succeeds, migrate to bcrypt
        if (isValidPassword) {
          const hashedPassword = await hashPassword(password);
          await this.updateUserPassword(user.id, hashedPassword);
          console.log('Password migrated to bcrypt for user:', email);
        }
      }

      if (isValidPassword) {
        // Convert to proper User type (remove password from response)
        const { password: _, ...userWithoutPassword } = user;
        return {
          ...userWithoutPassword,
          role: userWithoutPassword.role as 'CUSTOMER' | 'MECHANIC' | 'ADMIN'
        };
      }

      return null;
    } catch (error) {
      console.error('Error authenticating user:', error);
      return null;
    }
  }

  /**
   * Update a user's password (internal method)
   */
  private async updateUserPassword(userId: string, hashedPassword: string): Promise<boolean> {
    try {
      const users = await this.getStoredUsers();
      const updatedUsers = users.map(u =>
        u.id === userId ? { ...u, password: hashedPassword } : u
      );
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
      return true;
    } catch (error) {
      console.error('Error updating user password:', error);
      return false;
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: Omit<User, 'id' | 'createdAt'> & { password: string }): Promise<User | null> {
    try {
      const users = await this.getStoredUsers();

      // Check if user with email already exists
      if (users.some(u => u.email === userData.email)) {
        throw new Error('User with this email already exists');
      }

      // Hash the password before storing
      const hashedPassword = await hashPassword(userData.password);

      const newUser = {
        ...userData,
        password: hashedPassword, // Store hashed password
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
        role: userWithoutPassword.role as 'CUSTOMER' | 'MECHANIC' | 'ADMIN'
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
   * Create a new service request
   */
  async createServiceRequest(requestData: {
    customerId: string;
    serviceType: string;
    description: string;
    vehicleInfo: {
      make: string;
      model: string;
      year: number;
      vin?: string;
    };
    location: {
      address: string;
      latitude?: number;
      longitude?: number;
    };
    scheduledDate?: string;
    partsApproved?: boolean;
    estimatedCost?: number;
  }): Promise<any> {
    try {
      const requestsJson = await AsyncStorage.getItem(STORAGE_KEYS.SERVICE_REQUESTS);
      const requests = requestsJson ? JSON.parse(requestsJson) : [];

      const newRequest = {
        ...requestData,
        id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        partsApproved: requestData.partsApproved ?? false,
        timeStarted: null,
        timePaused: null,
        timeEnded: null,
        totalDuration: 0,
        mechanicId: null,
        activityLog: [],
        photos: [],
      };

      const updatedRequests = [...requests, newRequest];
      await AsyncStorage.setItem(STORAGE_KEYS.SERVICE_REQUESTS, JSON.stringify(updatedRequests));

      return newRequest;
    } catch (error) {
      console.error('Error creating service request:', error);
      return null;
    }
  }

  /**
   * Get all service requests
   */
  async getServiceRequests(): Promise<any[]> {
    try {
      const requestsJson = await AsyncStorage.getItem(STORAGE_KEYS.SERVICE_REQUESTS);
      return requestsJson ? JSON.parse(requestsJson) : [];
    } catch (error) {
      console.error('Error getting service requests:', error);
      return [];
    }
  }

  /**
   * Get service requests for a specific customer
   */
  async getServiceRequestsForCustomer(customerId: string): Promise<any[]> {
    try {
      const requests = await this.getServiceRequests();
      return requests.filter((r: any) => r.customerId === customerId);
    } catch (error) {
      console.error('Error getting customer service requests:', error);
      return [];
    }
  }

  /**
   * Get service requests for a specific mechanic
   */
  async getServiceRequestsForMechanic(mechanicId: string): Promise<any[]> {
    try {
      const requests = await this.getServiceRequests();
      return requests.filter((r: any) => r.mechanicId === mechanicId);
    } catch (error) {
      console.error('Error getting mechanic service requests:', error);
      return [];
    }
  }

  /**
   * Get a single service request by ID
   */
  async getServiceRequestById(requestId: string): Promise<any | null> {
    try {
      const requests = await this.getServiceRequests();
      return requests.find((r: any) => r.id === requestId) || null;
    } catch (error) {
      console.error('Error getting service request:', error);
      return null;
    }
  }

  /**
   * Update service request status
   */
  async updateServiceRequestStatus(requestId: string, status: string): Promise<boolean> {
    try {
      const requests = await this.getServiceRequests();
      const updatedRequests = requests.map((r: any) =>
        r.id === requestId
          ? { ...r, status, updatedAt: new Date().toISOString() }
          : r
      );

      await AsyncStorage.setItem(STORAGE_KEYS.SERVICE_REQUESTS, JSON.stringify(updatedRequests));
      return true;
    } catch (error) {
      console.error('Error updating service request status:', error);
      return false;
    }
  }

  /**
   * Assign a mechanic to a service request
   */
  async assignMechanic(requestId: string, mechanicId: string): Promise<boolean> {
    try {
      const requests = await this.getServiceRequests();
      const updatedRequests = requests.map((r: any) =>
        r.id === requestId
          ? {
              ...r,
              mechanicId,
              status: 'accepted',
              updatedAt: new Date().toISOString(),
            }
          : r
      );

      await AsyncStorage.setItem(STORAGE_KEYS.SERVICE_REQUESTS, JSON.stringify(updatedRequests));
      return true;
    } catch (error) {
      console.error('Error assigning mechanic:', error);
      return false;
    }
  }

  /**
   * Update service request data
   */
  async updateServiceRequest(requestId: string, updates: any): Promise<boolean> {
    try {
      const requests = await this.getServiceRequests();
      const updatedRequests = requests.map((r: any) =>
        r.id === requestId
          ? { ...r, ...updates, updatedAt: new Date().toISOString() }
          : r
      );

      await AsyncStorage.setItem(STORAGE_KEYS.SERVICE_REQUESTS, JSON.stringify(updatedRequests));
      return true;
    } catch (error) {
      console.error('Error updating service request:', error);
      return false;
    }
  }

  /**
   * Add photo to service request
   */
  async addServiceRequestPhoto(
    requestId: string,
    photo: {
      url: string;
      description?: string;
      mechanicId: string;
    }
  ): Promise<boolean> {
    try {
      const requests = await this.getServiceRequests();
      const updatedRequests = requests.map((r: any) => {
        if (r.id === requestId) {
          const photos = r.photos || [];
          photos.push({
            id: `photo-${Date.now()}`,
            ...photo,
            timestamp: new Date().toISOString(),
          });
          return { ...r, photos, updatedAt: new Date().toISOString() };
        }
        return r;
      });

      await AsyncStorage.setItem(STORAGE_KEYS.SERVICE_REQUESTS, JSON.stringify(updatedRequests));
      return true;
    } catch (error) {
      console.error('Error adding photo to service request:', error);
      return false;
    }
  }

  /**
   * Add activity log entry to service request
   */
  async addServiceRequestActivity(
    requestId: string,
    activity: {
      mechanicId: string;
      activity: string;
      notes?: string;
      duration?: number;
    }
  ): Promise<boolean> {
    try {
      const requests = await this.getServiceRequests();
      const updatedRequests = requests.map((r: any) => {
        if (r.id === requestId) {
          const activityLog = r.activityLog || [];
          activityLog.push({
            ...activity,
            timestamp: new Date().toISOString(),
          });
          return { ...r, activityLog, updatedAt: new Date().toISOString() };
        }
        return r;
      });

      await AsyncStorage.setItem(STORAGE_KEYS.SERVICE_REQUESTS, JSON.stringify(updatedRequests));
      return true;
    } catch (error) {
      console.error('Error adding activity to service request:', error);
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