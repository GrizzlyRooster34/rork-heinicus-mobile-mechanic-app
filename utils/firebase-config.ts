// Firebase configuration and utilities
export const ENV_CONFIG = {
  showQuickAccess: true, // Always true for development
  isProduction: false,
  enableLogging: true,
};

export const PRODUCTION_CONFIG = {
  showQuickAccess: true,
  isProduction: true,
  enableLogging: false,
};

export const COLLECTIONS = {
  USERS: 'users',
  SERVICE_REQUESTS: 'service_requests',
  QUOTES: 'quotes',
  CHAT_MESSAGES: 'chat_messages',
  VEHICLES: 'vehicles',
  MAINTENANCE_REMINDERS: 'maintenance_reminders',
  MAINTENANCE_RECORDS: 'maintenance_records',
  JOB_LOGS: 'job_logs',
};

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

export const NOTIFICATION_CONFIG = {
  FCM_SERVER_KEY: process.env.EXPO_PUBLIC_FCM_SERVER_KEY || '',
  APNS_KEY_ID: process.env.EXPO_PUBLIC_APNS_KEY_ID || '',
  APNS_TEAM_ID: process.env.EXPO_PUBLIC_APNS_TEAM_ID || '',
  APNS_PRIVATE_KEY: process.env.EXPO_PUBLIC_APNS_PRIVATE_KEY || '',
  EXPO_PUSH_TOKEN: process.env.EXPO_PUBLIC_EXPO_PUSH_TOKEN || '',
};

export function logProductionEvent(eventName: string, data?: any): void {
  if (ENV_CONFIG.enableLogging) {
    console.log(`[${new Date().toISOString()}] ${eventName}:`, data);
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}