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

// Firebase config (set via Expo env vars for production).
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

export const COLLECTIONS = {
  USERS: 'users',
  SERVICE_REQUESTS: 'serviceRequests',
  QUOTES: 'quotes',
  CHAT_MESSAGES: 'chatMessages',
  VEHICLES: 'vehicles',
};
