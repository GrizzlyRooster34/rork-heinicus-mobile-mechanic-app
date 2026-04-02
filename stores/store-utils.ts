/**
 * Store utility functions for error handling, logging, and persistence
 */

export interface StoreError {
  message: string;
  timestamp: Date;
  action: string;
  data?: any;
}

export class StoreErrorHandler {
  private static errors: StoreError[] = [];
  
  static logError(action: string, error: Error | string, data?: any) {
    const storeError: StoreError = {
      message: typeof error === 'string' ? error : error.message,
      timestamp: new Date(),
      action,
      data
    };
    
    this.errors.push(storeError);
    
    // Keep only last 50 errors
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(-50);
    }
    
    // Console logging for development
    console.error(`[Store Error] ${action}:`, storeError.message, data);
  }
  
  static getErrors(): StoreError[] {
    return [...this.errors];
  }
  
  static clearErrors() {
    this.errors = [];
  }
}

export function withErrorHandling<T extends any[], R>(
  actionName: string,
  fn: (...args: T) => R
): (...args: T) => R {
  return (...args: T): R => {
    try {
      const result = fn(...args);
      
      // Log successful action for debugging
      console.log(`[Store Action] ${actionName}:`, 'Success');
      
      return result;
    } catch (error) {
      StoreErrorHandler.logError(actionName, error as Error, args);
      throw error;
    }
  };
}

export function withAsyncErrorHandling<T extends any[], R>(
  actionName: string,
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      const result = await fn(...args);
      
      // Log successful action for debugging
      console.log(`[Store Action] ${actionName}:`, 'Success');
      
      return result;
    } catch (error) {
      StoreErrorHandler.logError(actionName, error as Error, args);
      throw error;
    }
  };
}

/**
 * Validate data before store operations
 */
export function validateData<T>(data: T, validator: (data: T) => boolean, errorMessage: string): T {
  if (!validator(data)) {
    throw new Error(errorMessage);
  }
  return data;
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch (error) {
    StoreErrorHandler.logError('JSON_PARSE', error as Error, { json });
    return fallback;
  }
}

/**
 * Store persistence utilities
 */
export interface StoreHydrationConfig {
  version: number;
  migrations?: Record<number, (state: any) => any>;
}

export function createStoreWithMigration<T>(
  initialState: T,
  config: StoreHydrationConfig
) {
  return {
    ...initialState,
    _version: config.version,
    _migrate: (persistedState: any) => {
      if (!persistedState || !persistedState._version) {
        return initialState;
      }
      
      let migratedState = persistedState;
      const currentVersion = config.version;
      const persistedVersion = persistedState._version;
      
      if (persistedVersion < currentVersion && config.migrations) {
        // Run migrations
        for (let version = persistedVersion + 1; version <= currentVersion; version++) {
          if (config.migrations[version]) {
            try {
              migratedState = config.migrations[version](migratedState);
              migratedState._version = version;
            } catch (error) {
              StoreErrorHandler.logError(`MIGRATION_${version}`, error as Error, migratedState);
              return initialState; // Fallback to initial state on migration error
            }
          }
        }
      }
      
      return migratedState;
    }
  };
}

/**
 * Debounce utility for store updates
 */
export function debounce<T extends any[]>(
  func: (...args: T) => void,
  delay: number
): (...args: T) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Store action logging for debugging
 */
export function logStoreAction(storeName: string, action: string, data?: any) {
  // Log in development or when debug mode is enabled
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    console.log(`[${storeName}] ${action}:`, data);
  }
}