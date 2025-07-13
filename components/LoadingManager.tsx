import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { LoadingOverlay } from './LoadingState';

interface LoadingItem {
  id: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  startTime: number;
}

interface LoadingContextType {
  showLoading: (id: string, message: string, priority?: 'low' | 'medium' | 'high') => void;
  hideLoading: (id: string) => void;
  updateLoading: (id: string, message: string) => void;
  isLoading: (id?: string) => boolean;
  getLoadingMessage: () => string;
  clearAll: () => void;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

interface LoadingProviderProps {
  children: React.ReactNode;
  globalOverlay?: boolean;
  maxDisplayTime?: number;
}

export function LoadingProvider({ 
  children, 
  globalOverlay = true,
  maxDisplayTime = 30000 // 30 seconds max
}: LoadingProviderProps) {
  const [loadingItems, setLoadingItems] = useState<Map<string, LoadingItem>>(new Map());
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const showLoading = useCallback((id: string, message: string, priority: 'low' | 'medium' | 'high' = 'medium') => {
    setLoadingItems(prev => {
      const newMap = new Map(prev);
      newMap.set(id, {
        id,
        message,
        priority,
        startTime: Date.now(),
      });
      return newMap;
    });

    // Auto-hide after max display time to prevent stuck loading states
    const timeoutId = setTimeout(() => {
      hideLoading(id);
      // eslint-disable-next-line no-console
      console.warn(`Loading state '${id}' was automatically cleared after ${maxDisplayTime}ms`);
    }, maxDisplayTime);

    timeoutRefs.current.set(id, timeoutId);
  }, [maxDisplayTime, hideLoading]);

  const hideLoading = useCallback((id: string) => {
    setLoadingItems(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });

    // Clear the timeout
    const timeoutId = timeoutRefs.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(id);
    }
  }, []);

  const updateLoading = useCallback((id: string, message: string) => {
    setLoadingItems(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(id);
      if (existing) {
        newMap.set(id, { ...existing, message });
      }
      return newMap;
    });
  }, []);

  const isLoading = useCallback((id?: string) => {
    if (id) {
      return loadingItems.has(id);
    }
    return loadingItems.size > 0;
  }, [loadingItems]);

  const getLoadingMessage = useCallback(() => {
    if (loadingItems.size === 0) return '';

    // Sort by priority and return the highest priority message
    const sortedItems = Array.from(loadingItems.values()).sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return sortedItems[0]?.message || 'Loading...';
  }, [loadingItems]);

  const clearAll = useCallback(() => {
    // Clear all timeouts
    timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
    timeoutRefs.current.clear();
    
    setLoadingItems(new Map());
  }, []);

  const contextValue: LoadingContextType = {
    showLoading,
    hideLoading,
    updateLoading,
    isLoading,
    getLoadingMessage,
    clearAll,
  };

  const hasLoadingItems = loadingItems.size > 0;
  const loadingMessage = getLoadingMessage();

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      {globalOverlay && (
        <LoadingOverlay
          visible={hasLoadingItems}
          message={loadingMessage}
          transparent={false}
        />
      )}
    </LoadingContext.Provider>
  );
}

// Hook for managing a specific loading state
export function useLoadingState(id: string) {
  const { showLoading, hideLoading, updateLoading, isLoading } = useLoading();

  const show = useCallback((message: string, priority?: 'low' | 'medium' | 'high') => {
    showLoading(id, message, priority);
  }, [id, showLoading]);

  const hide = useCallback(() => {
    hideLoading(id);
  }, [id, hideLoading]);

  const update = useCallback((message: string) => {
    updateLoading(id, message);
  }, [id, updateLoading]);

  const loading = isLoading(id);

  return {
    show,
    hide,
    update,
    isLoading: loading,
  };
}

// Hook for managing async operations with automatic loading states
export function useAsyncWithLoading<T>(id: string, defaultMessage = 'Loading...') {
  const { show, hide, update, isLoading } = useLoadingState(id);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async (
    operation: () => Promise<T>,
    message?: string,
    priority?: 'low' | 'medium' | 'high'
  ) => {
    try {
      setError(null);
      show(message || defaultMessage, priority);
      
      const result = await operation();
      setData(result);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      throw error;
    } finally {
      hide();
    }
  }, [show, hide, defaultMessage]);

  const reset = useCallback(() => {
    setError(null);
    setData(null);
    hide();
  }, [hide]);

  return {
    execute,
    reset,
    update,
    isLoading,
    error,
    data,
  };
}

// Higher-order component for automatic loading management
export function withLoadingManagement<P extends object>(
  Component: React.ComponentType<P>,
  loadingId: string,
  defaultMessage = 'Loading...'
) {
  return function LoadingManagedComponent(props: P) {
    const loadingState = useLoadingState(loadingId);

    return (
      <LoadingProvider>
        <Component {...props} loadingState={loadingState} />
      </LoadingProvider>
    );
  };
}