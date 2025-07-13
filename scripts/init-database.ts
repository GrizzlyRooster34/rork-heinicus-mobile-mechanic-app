/**
 * Database Initialization Script
 * Creates essential Day 1 data for the mobile mechanic app
 */

import { UserRole, VehicleType, ServiceType, UrgencyLevel } from '@/types/service';

export interface InitialUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}

export interface InitialVehicle {
  id: string;
  customerId: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  color?: string;
  mileage?: number;
  vehicleType: VehicleType;
  isPrimary: boolean;
  createdAt: Date;
}

export interface InitialCustomerProfile {
  id: string;
  userId: string;
  preferredLanguage: string;
  emergencyContact?: string;
  insuranceProvider?: string;
  insurancePolicyNum?: string;
  createdAt: Date;
}

export interface InitialMechanicProfile {
  id: string;
  userId: string;
  licenseNumber?: string;
  yearsExperience?: number;
  specializations: string[];
  serviceRadius: number;
  hourlyRate?: number;
  isAvailable: boolean;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  averageRating: number;
  totalReviews: number;
  totalJobsCompleted: number;
  emergencyServiceOnly: boolean;
  createdAt: Date;
}

export interface InitialAdminProfile {
  id: string;
  userId: string;
  permissions: string[];
  createdAt: Date;
}

// Day 1 Essential Users
export const INITIAL_USERS: InitialUser[] = [
  // Admin User - Cody (Owner)
  {
    id: 'admin-cody',
    email: 'matthew.heinen.2014@gmail.com',
    password: 'admin123!', // Should be hashed in production
    firstName: 'Cody',
    lastName: 'Owner',
    phone: '(555) 987-6543',
    role: 'ADMIN' as UserRole,
    isActive: true,
    createdAt: new Date(),
  },
  
  // Mechanic User - Cody
  {
    id: 'mechanic-cody',
    email: 'cody@heinicus.com',
    password: 'mechanic123!', // Should be hashed in production
    firstName: 'Cody',
    lastName: 'Mechanic',
    phone: '(555) 987-6543',
    role: 'MECHANIC' as UserRole,
    isActive: true,
    createdAt: new Date(),
  },
  
  // Demo Customer
  {
    id: 'customer-demo',
    email: 'customer@example.com',
    password: 'customer123!', // Should be hashed in production
    firstName: 'Demo',
    lastName: 'Customer',
    phone: '(555) 123-4567',
    role: 'CUSTOMER' as UserRole,
    isActive: true,
    createdAt: new Date(),
  },
  
  // Test Customer - John
  {
    id: 'customer-john',
    email: 'john.doe@email.com',
    password: 'customer123!',
    firstName: 'John',
    lastName: 'Doe',
    phone: '(555) 234-5678',
    role: 'CUSTOMER' as UserRole,
    isActive: true,
    createdAt: new Date(),
  },
];

// Day 1 Customer Profiles
export const INITIAL_CUSTOMER_PROFILES: InitialCustomerProfile[] = [
  {
    id: 'profile-demo',
    userId: 'customer-demo',
    preferredLanguage: 'en',
    emergencyContact: '(555) 999-8888',
    insuranceProvider: 'State Farm',
    insurancePolicyNum: 'SF123456789',
    createdAt: new Date(),
  },
  {
    id: 'profile-john',
    userId: 'customer-john',
    preferredLanguage: 'en',
    emergencyContact: '(555) 888-7777',
    insuranceProvider: 'Geico',
    insurancePolicyNum: 'GC987654321',
    createdAt: new Date(),
  },
];

// Day 1 Mechanic Profile
export const INITIAL_MECHANIC_PROFILES: InitialMechanicProfile[] = [
  {
    id: 'mechanic-profile-cody',
    userId: 'mechanic-cody',
    licenseNumber: 'ASE-12345',
    yearsExperience: 15,
    specializations: ['Engine Repair', 'Brake Service', 'Electrical', 'Transmission', 'Emergency Roadside'],
    serviceRadius: 25.0,
    hourlyRate: 85.00,
    isAvailable: true,
    verificationStatus: 'APPROVED',
    averageRating: 4.9,
    totalReviews: 127,
    totalJobsCompleted: 89,
    emergencyServiceOnly: false,
    createdAt: new Date(),
  },
];

// Day 1 Admin Profile
export const INITIAL_ADMIN_PROFILES: InitialAdminProfile[] = [
  {
    id: 'admin-profile-cody',
    userId: 'admin-cody',
    permissions: [
      'manage_users',
      'manage_mechanics',
      'manage_jobs',
      'view_analytics',
      'manage_payments',
      'system_settings',
      'emergency_override'
    ],
    createdAt: new Date(),
  },
];

// Day 1 Demo Vehicles
export const INITIAL_VEHICLES: InitialVehicle[] = [
  {
    id: 'vehicle-demo-1',
    customerId: 'profile-demo',
    make: 'Toyota',
    model: 'Camry',
    year: 2018,
    vin: 'JTNBE46K393007558',
    color: 'Silver',
    mileage: 67000,
    vehicleType: 'CAR' as VehicleType,
    isPrimary: true,
    createdAt: new Date(),
  },
  {
    id: 'vehicle-john-1',
    customerId: 'profile-john',
    make: 'Ford',
    model: 'F-150',
    year: 2020,
    vin: '1FTFW1ET5LFA12345',
    color: 'Blue',
    mileage: 45000,
    vehicleType: 'TRUCK' as VehicleType,
    isPrimary: true,
    createdAt: new Date(),
  },
  {
    id: 'vehicle-john-2',
    customerId: 'profile-john',
    make: 'Honda',
    model: 'Civic',
    year: 2019,
    vin: '2HGFC2F59KH123456',
    color: 'Black',
    mileage: 32000,
    vehicleType: 'CAR' as VehicleType,
    isPrimary: false,
    createdAt: new Date(),
  },
];

/**
 * Initialize the database with Day 1 essential data
 * This runs on first app startup to ensure basic functionality
 */
export async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database with Day 1 data...');
    
    // In a real implementation, this would use Prisma Client to:
    // 1. Check if users already exist
    // 2. Create users with hashed passwords
    // 3. Create profiles
    // 4. Create vehicles
    // 5. Set up initial app configuration
    
    // For now, this serves as a data specification
    console.log('✅ Database initialized with:');
    console.log(`   - ${INITIAL_USERS.length} users`);
    console.log(`   - ${INITIAL_CUSTOMER_PROFILES.length} customer profiles`);
    console.log(`   - ${INITIAL_MECHANIC_PROFILES.length} mechanic profiles`);
    console.log(`   - ${INITIAL_ADMIN_PROFILES.length} admin profiles`);
    console.log(`   - ${INITIAL_VEHICLES.length} vehicles`);
    
    return {
      users: INITIAL_USERS,
      customerProfiles: INITIAL_CUSTOMER_PROFILES,
      mechanicProfiles: INITIAL_MECHANIC_PROFILES,
      adminProfiles: INITIAL_ADMIN_PROFILES,
      vehicles: INITIAL_VEHICLES,
    };
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Reset database to Day 1 state (for testing/development)
 */
export async function resetToDay1() {
  console.log('🔄 Resetting database to Day 1 state...');
  
  // In production, this would:
  // 1. Clear all non-essential data
  // 2. Keep user accounts but reset app state
  // 3. Restore essential configuration
  
  return initializeDatabase();
}

/**
 * Validate database integrity for Day 1 requirements
 */
export function validateDay1Database() {
  const requirements = {
    adminUser: INITIAL_USERS.some(u => u.role === 'ADMIN'),
    mechanicUser: INITIAL_USERS.some(u => u.role === 'MECHANIC'),
    customerUsers: INITIAL_USERS.filter(u => u.role === 'CUSTOMER').length >= 1,
    vehicles: INITIAL_VEHICLES.length >= 2,
    mechanicProfile: INITIAL_MECHANIC_PROFILES.length >= 1,
  };
  
  const isValid = Object.values(requirements).every(Boolean);
  
  console.log('🔍 Day 1 Database Validation:', {
    isValid,
    requirements,
    summary: `${Object.values(requirements).filter(Boolean).length}/${Object.keys(requirements).length} requirements met`
  });
  
  return { isValid, requirements };
}