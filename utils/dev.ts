import { User } from '@/types/auth';

// CRITICAL: devMode is now controlled by NODE_ENV environment variable
// This ensures development features are NEVER enabled in production builds
export const devMode = process.env.NODE_ENV !== 'production';

// SECURITY WARNING: These credentials are for DEVELOPMENT ONLY
// In production, all authentication must use the database with hashed passwords
// These credentials are loaded from environment variables to avoid hardcoding
export const DEV_CREDENTIALS = {
  admin: {
    email: process.env.DEV_ADMIN_EMAIL || '',
    password: process.env.DEV_ADMIN_PASSWORD || '',
  },
  mechanic: {
    email: process.env.DEV_MECHANIC_EMAIL || '',
    password: process.env.DEV_MECHANIC_PASSWORD || '',
  },
  customer: {
    email: process.env.DEV_CUSTOMER_EMAIL || '',
    password: process.env.DEV_CUSTOMER_PASSWORD || '',
  },
};

export function isDevCredentials(email: string, password: string): boolean {
  // Only allow dev credentials if in development mode
  if (!devMode) {
    return false;
  }

  return Object.values(DEV_CREDENTIALS).some(
    cred => cred.email && cred.password && cred.email === email && cred.password === password
  );
}

export function getDevUser(email: string): User | null {
  if (email === DEV_CREDENTIALS.admin.email) {
    return {
      id: 'admin-cody',
      email: DEV_CREDENTIALS.admin.email,
      firstName: 'Cody',
      lastName: 'Owner',
      role: 'admin',
      phone: '(555) 987-6543',
      createdAt: new Date(),
    };
  }
  
  if (email === DEV_CREDENTIALS.mechanic.email) {
    return {
      id: 'mechanic-cody',
      email: DEV_CREDENTIALS.mechanic.email,
      firstName: 'Cody',
      lastName: 'Mechanic',
      role: 'mechanic',
      phone: '(555) 987-6543',
      createdAt: new Date(),
    };
  }
  
  if (email === DEV_CREDENTIALS.customer.email) {
    return {
      id: 'customer-demo',
      email: DEV_CREDENTIALS.customer.email,
      firstName: 'Demo',
      lastName: 'Customer',
      role: 'customer',
      phone: '(555) 123-4567',
      createdAt: new Date(),
    };
  }
  
  return null;
}