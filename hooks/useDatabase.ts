import { useCallback } from 'react';
import { mobileDB } from '@/lib/mobile-database';
import { useAsyncState } from './useAsyncState';
import { User } from '@/types/auth';
import { Vehicle } from '@/types/service';

export function useUsers() {
  const { execute, ...state } = useAsyncState<User[]>({
    initialData: [],
    resetOnStart: false,
  });

  const loadUsers = useCallback(() => {
    return execute(() => mobileDB.getUsers());
  }, [execute]);

  const authenticateUser = useCallback((email: string, password: string) => {
    return execute(() => mobileDB.authenticateUser(email, password));
  }, [execute]);

  const createUser = useCallback((userData: Omit<User, 'id' | 'createdAt'> & { password: string }) => {
    return execute(() => mobileDB.createUser(userData));
  }, [execute]);

  return {
    ...state,
    loadUsers,
    authenticateUser,
    createUser,
  };
}

export function useVehicles(customerId?: string) {
  const { execute, ...state } = useAsyncState<Vehicle[]>({
    initialData: [],
    resetOnStart: false,
  });

  const loadVehicles = useCallback(() => {
    if (!customerId) {
      throw new Error('Customer ID is required to load vehicles');
    }
    return execute(() => mobileDB.getVehiclesForCustomer(customerId));
  }, [execute, customerId]);

  const addVehicle = useCallback((vehicleData: Omit<Vehicle, 'id' | 'createdAt'>) => {
    return execute(() => mobileDB.addVehicle(vehicleData));
  }, [execute]);

  const updateVehicle = useCallback((vehicleId: string, updates: Partial<Vehicle>) => {
    return execute(async () => {
      const success = await mobileDB.updateVehicle(vehicleId, updates);
      if (!success) {
        throw new Error('Failed to update vehicle');
      }
      return success;
    });
  }, [execute]);

  return {
    ...state,
    loadVehicles,
    addVehicle,
    updateVehicle,
  };
}

export function useDatabaseStatus() {
  const { execute, ...state } = useAsyncState({
    initialData: null,
    resetOnStart: false,
  });

  const loadStatus = useCallback(() => {
    return execute(() => mobileDB.getDatabaseStatus());
  }, [execute]);

  const initializeDatabase = useCallback(() => {
    return execute(() => mobileDB.initializeIfNeeded());
  }, [execute]);

  const clearDatabase = useCallback(() => {
    return execute(() => mobileDB.clearDatabase());
  }, [execute]);

  return {
    ...state,
    loadStatus,
    initializeDatabase,
    clearDatabase,
  };
}

export function useAsyncOperation<T>(options?: {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}) {
  const { execute, ...state } = useAsyncState<T>(options);

  const run = useCallback((operation: () => Promise<T>) => {
    return execute(operation);
  }, [execute]);

  return {
    ...state,
    run,
  };
}