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
        // Wait for stores to hydrate from persistence with proper async handling
        let retries = 0;
        const maxRetries = 50; // 5 seconds max wait time
        
        while (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 100));
          
          try {
            // Check if stores are properly hydrated without blocking
            const stores = await Promise.all([
              Promise.resolve(useAuthStore.getState()),
              Promise.resolve(useAppStore.getState()),
              Promise.resolve(useSettingsStore.getState()),
              Promise.resolve(useAdminSettingsStore.getState()),
            ]);
            
            // Validate that stores are objects and not undefined
            const [authState, appState, settingsState, adminSettingsState] = stores;
            
            if (authState && typeof authState === 'object' && 
                appState && typeof appState === 'object' && 
                settingsState && typeof settingsState === 'object' && 
                adminSettingsState && typeof adminSettingsState === 'object') {
              
              console.log('✅ Stores hydrated successfully after', retries * 100, 'ms');
              setIsHydrated(true);
              return;
            }
          } catch (storeError) {
            console.warn('Store access attempt failed:', storeError);
          }
          
          retries++;
        }
        
        // If we get here, stores didn't hydrate properly within timeout
        console.warn('⚠️ Store hydration timeout - proceeding anyway');
        setIsHydrated(true); // Allow app to continue even if stores aren't fully ready
        
      } catch (error) {
        console.error('❌ Store initialization error:', error);
        StoreErrorHandler.logError('STORE_INITIALIZATION', error as Error);
        
        // Don't block app startup for store errors - provide fallback
        console.warn('🔄 Continuing with fallback store initialization');
        setIsHydrated(true);
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