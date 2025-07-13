import { useState, useCallback } from 'react';

export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
  isError: boolean;
}

export interface AsyncStateOptions {
  initialData?: any;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  resetOnStart?: boolean;
}

export function useAsyncState<T>(options: AsyncStateOptions = {}) {
  const [state, setState] = useState<AsyncState<T>>({
    data: options.initialData || null,
    isLoading: false,
    error: null,
    isSuccess: false,
    isError: false,
  });

  const execute = useCallback(async (asyncFunction: () => Promise<T>) => {
    if (options.resetOnStart !== false) {
      setState({
        data: options.initialData || null,
        isLoading: true,
        error: null,
        isSuccess: false,
        isError: false,
      });
    } else {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        isSuccess: false,
        isError: false,
      }));
    }

    try {
      const result = await asyncFunction();
      
      setState({
        data: result,
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      });

      if (options.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        isSuccess: false,
        isError: true,
      }));

      if (options.onError) {
        options.onError(error as Error);
      }

      throw error;
    }
  }, [options]);

  const reset = useCallback(() => {
    setState({
      data: options.initialData || null,
      isLoading: false,
      error: null,
      isSuccess: false,
      isError: false,
    });
  }, [options.initialData]);

  const setData = useCallback((data: T) => {
    setState(prev => ({
      ...prev,
      data,
      isSuccess: true,
      isError: false,
    }));
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      error,
      isLoading: false,
      isSuccess: false,
      isError: true,
    }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
    setError,
  };
}