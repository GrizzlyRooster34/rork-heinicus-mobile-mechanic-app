import { User } from '@/types/auth';

export const devMode = true; // Set to false for production

export const DEV_CREDENTIALS = {
  admin: {
    email: 'admin@dev.local',
    password: 'DevAdminPass123!@',
  },
  mechanic: {
    email: 'mechanic@dev.local',
    password: 'DevMechanicPass123!@',
  },
  customer: {
    email: 'customer@dev.local',
    password: 'DevCustomerPass123!@',
  },
};

export function isDevCredentials(email: string, password: string): boolean {
  return Object.values(DEV_CREDENTIALS).some(
    cred => cred.email === email && cred.password === password
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