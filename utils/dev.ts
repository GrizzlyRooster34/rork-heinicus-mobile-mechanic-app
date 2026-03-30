import { User } from '@/types/auth';

// Dev auth is opt-in and only available in development builds.
export const devMode = __DEV__ && process.env.EXPO_PUBLIC_ENABLE_DEV_AUTH === 'true';

export const DEV_CREDENTIALS = {
  admin: {
    email: process.env.EXPO_PUBLIC_DEV_ADMIN_EMAIL || 'admin@example.com',
    password: process.env.EXPO_PUBLIC_DEV_ADMIN_PASSWORD || '',
  },
  mechanic: {
    email: process.env.EXPO_PUBLIC_DEV_MECHANIC_EMAIL || 'mechanic@example.com',
    password: process.env.EXPO_PUBLIC_DEV_MECHANIC_PASSWORD || '',
  },
  customer: {
    email: process.env.EXPO_PUBLIC_DEV_CUSTOMER_EMAIL || 'customer@example.com',
    password: process.env.EXPO_PUBLIC_DEV_CUSTOMER_PASSWORD || '',
  },
};

export function isDevCredentials(email: string, password: string): boolean {
  if (!devMode) {
    return false;
  }

  return Object.values(DEV_CREDENTIALS).some(
    cred => cred.password.length > 0 && cred.email === email && cred.password === password
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
