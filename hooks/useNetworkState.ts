import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';

export interface NetworkState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
  isError: boolean;
  retryCount: number;
}

export interface NetworkOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  showErrorAlert?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onRetry?: (retryCount: number) => void;
}

export function useNetworkState<T>(options: NetworkOptions = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 10000,
    onSuccess,
    onError,
    onRetry,
  } = options;

  const [state, setState] = useState<NetworkState<T>>({
    data: null,
    isLoading: false,
    error: null,
    isSuccess: false,
    isError: false,
    retryCount: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (
    networkOperation: (signal: AbortSignal) => Promise<T>,
    customOptions?: Partial<NetworkOptions>
  ) => {
    const opts = { ...options, ...customOptions };
    
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      isSuccess: false,
      isError: false,
    }));

    let currentRetry = 0;
    
    const attemptRequest = async (): Promise<T> => {
      try {
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Request timeout after ${timeout}ms`));
          }, timeout);
        });

        // Race between the network operation and timeout
        const result = await Promise.race([
          networkOperation(signal),
          timeoutPromise,
        ]);

        setState(prev => ({
          ...prev,
          data: result,
          isLoading: false,
          isSuccess: true,
          isError: false,
        }));

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (error) {
        // If request was aborted, don't retry
        if (signal.aborted) {
          throw new Error('Request was cancelled');
        }

        currentRetry++;
        
        // If we haven't exceeded max retries, try again
        if (currentRetry <= maxRetries) {
          setState(prev => ({
            ...prev,
            retryCount: currentRetry,
          }));

          if (onRetry) {
            onRetry(currentRetry);
          }

          // Wait before retrying (exponential backoff)
          await new Promise(resolve => 
            setTimeout(resolve, retryDelay * Math.pow(2, currentRetry - 1))
          );

          return attemptRequest();
        } else {
          // Max retries exceeded
          const errorMessage = error instanceof Error ? error.message : 'Network request failed';
          
          setState(prev => ({
            ...prev,
            error: errorMessage,
            isLoading: false,
            isSuccess: false,
            isError: true,
            retryCount: currentRetry,
          }));

          if (opts.showErrorAlert) {
            Alert.alert(
              'Network Error',
              `${errorMessage}\n\nTried ${currentRetry} times.`,
              [{ text: 'OK' }]
            );
          }

          if (onError) {
            onError(error as Error);
          }

          throw error;
        }
      }
    };

    return attemptRequest();
  }, [maxRetries, retryDelay, timeout, options, onSuccess, onError, onRetry]);

  const retry = useCallback(() => {
    if (state.isLoading) return;
    
    setState(prev => ({
      ...prev,
      retryCount: 0,
    }));
  }, [state.isLoading]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setState(prev => ({
      ...prev,
      isLoading: false,
      error: 'Request cancelled',
      isError: true,
    }));
  }, []);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setState({
      data: null,
      isLoading: false,
      error: null,
      isSuccess: false,
      isError: false,
      retryCount: 0,
    });
  }, []);

  return {
    ...state,
    execute,
    retry,
    cancel,
    reset,
  };
}

// Specialized hooks for common network operations
export function useFetch<T>(url: string, options?: RequestInit & NetworkOptions) {
  const networkState = useNetworkState<T>(options);

  const fetch = useCallback(async (customUrl?: string, customOptions?: RequestInit) => {
    const finalUrl = customUrl || url;
    const finalOptions = { ...options, ...customOptions };
    
    return networkState.execute(async (signal) => {
      const response = await window.fetch(finalUrl, {
        ...finalOptions,
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    });
  }, [url, options, networkState]);

  return {
    ...networkState,
    fetch,
  };
}

export function useApi<T>(baseUrl: string, options?: NetworkOptions) {
  const networkState = useNetworkState<T>(options);

  const get = useCallback(async (endpoint: string, params?: Record<string, any>) => {
    const url = new URL(endpoint, baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    return networkState.execute(async (signal) => {
      const response = await fetch(url.toString(), { signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    });
  }, [baseUrl, networkState]);

  const post = useCallback(async (endpoint: string, data?: any) => {
    const url = new URL(endpoint, baseUrl);

    return networkState.execute(async (signal) => {
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    });
  }, [baseUrl, networkState]);

  const put = useCallback(async (endpoint: string, data?: any) => {
    const url = new URL(endpoint, baseUrl);

    return networkState.execute(async (signal) => {
      const response = await fetch(url.toString(), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    });
  }, [baseUrl, networkState]);

  const del = useCallback(async (endpoint: string) => {
    const url = new URL(endpoint, baseUrl);

    return networkState.execute(async (signal) => {
      const response = await fetch(url.toString(), {
        method: 'DELETE',
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    });
  }, [baseUrl, networkState]);

  return {
    ...networkState,
    get,
    post,
    put,
    delete: del,
  };
}