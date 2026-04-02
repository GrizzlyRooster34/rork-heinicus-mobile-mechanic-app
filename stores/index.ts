/**
 * Store exports - centralized store access
 */

export { useAuthStore } from './auth-store';
export { useAppStore } from './app-store';
export { useSettingsStore } from './settings-store';
export { useAdminSettingsStore } from './admin-settings-store';

// Store utilities
export { 
  StoreErrorHandler, 
  withErrorHandling, 
  withAsyncErrorHandling,
  validateData,
  safeJsonParse,
  createStoreWithMigration,
  logStoreAction
} from './store-utils';

// Type exports
export type { StoreError, StoreHydrationConfig } from './store-utils';