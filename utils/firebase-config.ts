// Firebase configuration and utilities
export const ENV_CONFIG = {
  showQuickAccess: true, // Always true for development
  isProduction: false,
  enableLogging: true,
};

export const PRODUCTION_CONFIG = {
  enableToolsModule: true,
  enableAnalytics: true,
  enablePushNotifications: true,
  enableLocationTracking: true,
  requireSignature: true,
};

export function logProductionEvent(event: string, data: any): void {
  if (ENV_CONFIG.enableLogging) {
    console.log(`[Production Event] ${event}:`, data);
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

// Firebase config placeholders for development. Populate for production.
export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

export const COLLECTIONS = {
  USERS: 'users',
  SERVICE_REQUESTS: 'serviceRequests',
  QUOTES: 'quotes',
  CHAT_MESSAGES: 'chatMessages',
  VEHICLES: 'vehicles',
};
