import { User } from '@/types/auth';

export const devMode = true; // Set to false for production

export const DEV_CREDENTIALS = {
  ADMIN: {
    email: 'matthew.heinen.2014@gmail.com',
    password: 'RoosTer669072!@',
  },
  MECHANIC: {
    email: 'cody@heinicus.com',
    password: 'RoosTer669072!@',
  },
  CUSTOMER: {
    email: 'customer@example.com',
    password: 'password',
  },
};

export function isDevCredentials(email: string, password: string): boolean {
  return Object.values(DEV_CREDENTIALS).some(
    cred => cred.email === email && cred.password === password
  );
}

export function getDevUser(email: string): User | null {
  if (email === DEV_CREDENTIALS.ADMIN.email) {
    return {
      id: 'admin-cody',
      email: DEV_CREDENTIALS.ADMIN.email,
      firstName: 'Cody',
      lastName: 'Owner',
      role: 'ADMIN',
      phone: '(555) 987-6543',
      createdAt: new Date(),
    };
  }

  if (email === DEV_CREDENTIALS.MECHANIC.email) {
    return {
      id: 'mechanic-cody',
      email: DEV_CREDENTIALS.MECHANIC.email,
      firstName: 'Cody',
      lastName: 'Mechanic',
      role: 'MECHANIC',
      phone: '(555) 987-6543',
      createdAt: new Date(),
    };
  }

  if (email === DEV_CREDENTIALS.CUSTOMER.email) {
    return {
      id: 'customer-demo',
      email: DEV_CREDENTIALS.CUSTOMER.email,
      firstName: 'Demo',
      lastName: 'Customer',
      role: 'CUSTOMER',
      phone: '(555) 123-4567',
      createdAt: new Date(),
    };
  }

  return null;
}