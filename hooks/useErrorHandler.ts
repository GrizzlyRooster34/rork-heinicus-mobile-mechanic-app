import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { logger } from '@/utils/logger';

export interface ErrorHandlerOptions {
  showAlert?: boolean;
  logError?: boolean;
  level?: 'info' | 'warn' | 'error';
  context?: string;
}

export interface UseErrorHandlerReturn {
  error: Error | null;
  hasError: boolean;
  handleError: (error: Error, options?: ErrorHandlerOptions) => void;
  clearError: () => void;
  retry: (fn: () => void | Promise<void>) => Promise<void>;
}

export function useErrorHandler(
  defaultOptions: ErrorHandlerOptions = {}
): UseErrorHandlerReturn {
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((
    error: Error,
    options: ErrorHandlerOptions = {}
  ) => {
    const opts = { ...defaultOptions, ...options };
    
    setError(error);

    // Log error if enabled
    if (opts.logError !== false) {
      const logLevel = opts.level || 'error';
      logger[logLevel](`Error in ${opts.context || 'component'}:`, {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    }

    // Show alert if enabled
    if (opts.showAlert) {
      Alert.alert(
        'Error',
        error.message || 'An unexpected error occurred',
        [{ text: 'OK' }]
      );
    }
  }, [defaultOptions]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retry = useCallback(async (fn: () => void | Promise<void>) => {
    try {
      clearError();
      await fn();
    } catch (error) {
      handleError(error as Error);
    }
  }, [handleError, clearError]);

  return {
    error,
    hasError: error !== null,
    handleError,
    clearError,
    retry,
  };
}

// Specialized hooks for common error scenarios
export function useAsyncErrorHandler() {
  return useErrorHandler({
    showAlert: true,
    logError: true,
    level: 'error',
    context: 'async_operation',
  });
}

export function useNetworkErrorHandler() {
  return useErrorHandler({
    showAlert: true,
    logError: true,
    level: 'warn',
    context: 'network_request',
  });
}

export function usePaymentErrorHandler() {
  return useErrorHandler({
    showAlert: true,
    logError: true,
    level: 'error',
    context: 'payment_processing',
  });
}