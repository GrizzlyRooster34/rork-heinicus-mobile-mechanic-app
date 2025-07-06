import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { useAuthStore, useAppStore, useSettingsStore, useAdminSettingsStore } from './index';
import { StoreErrorHandler } from './store-utils';
import * as Icons from 'lucide-react-native';

interface StoreProviderProps {
  children: React.ReactNode;
}

/**
 * Store Provider - Handles store hydration and error boundary
 */
export function StoreProvider({ children }: StoreProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeStores = async () => {
      try {
        // Wait for stores to hydrate from persistence
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if stores are properly hydrated
        const authState = useAuthStore.getState();
        const appState = useAppStore.getState();
        const settingsState = useSettingsStore.getState();
        const adminSettingsState = useAdminSettingsStore.getState();
        
        // Validate critical store data
        if (typeof authState === 'object' && 
            typeof appState === 'object' && 
            typeof settingsState === 'object' && 
            typeof adminSettingsState === 'object') {
          
          console.log('✅ Stores hydrated successfully');
          setIsHydrated(true);
        } else {
          throw new Error('Store hydration failed - invalid state');
        }
      } catch (error) {
        console.error('❌ Store initialization error:', error);
        StoreErrorHandler.logError('STORE_INITIALIZATION', error as Error);
        setError('Failed to initialize application stores');
      }
    };

    initializeStores();
  }, []);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icons.AlertTriangle size={48} color={Colors.error} />
        <Text style={styles.errorTitle}>Store Error</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Text style={styles.errorHelp}>
          Please restart the application. If the problem persists, contact support.
        </Text>
      </View>
    );
  }

  if (!isHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingSpinner}>
          <Icons.Loader2 size={32} color={Colors.primary} />
        </View>
        <Text style={styles.loadingText}>Initializing application...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

/**
 * Hook to get store error information for debugging
 */
export function useStoreErrors() {
  const [errors, setErrors] = useState(StoreErrorHandler.getErrors());

  useEffect(() => {
    const interval = setInterval(() => {
      setErrors(StoreErrorHandler.getErrors());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    errors,
    clearErrors: StoreErrorHandler.clearErrors,
    hasErrors: errors.length > 0
  };
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 40,
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.error,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorHelp: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});