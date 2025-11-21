import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/colors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, trpcClient } from '@/lib/trpc';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { StoreProvider } from '@/stores/StoreProvider';
import { mobileDB } from '@/lib/mobile-database';
import { ensureStripeInitialized } from '@/lib/stripe-init';

export const unstable_settings = {
  initialRouteName: 'auth',
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1000,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function AppContent() {
  const [isReady, setIsReady] = useState(false);

  const handleAppError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log critical app-level errors
    console.error('Critical App Error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // In production, send to crash reporting service
    if (process.env.NODE_ENV === 'production') {
      // Would send to Sentry, Bugsnag, etc.
    }
  };

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize app immediately without blocking
        setIsReady(true);
        SplashScreen.hideAsync();
        
        // Initialize database in background (non-blocking)
        mobileDB.initializeIfNeeded().catch(e => 
          console.warn('Background database init failed:', e)
        );
        
        // Initialize Stripe in background (non-blocking)
        ensureStripeInitialized().catch(e => 
          console.warn('Background Stripe init failed:', e)
        );
      } catch (e) {
        console.warn('App preparation failed:', e);
        setIsReady(true);
        SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <ErrorBoundary 
      level="app" 
      onError={handleAppError}
      resetKeys={[isReady]}
    >
      <StatusBar style="light" backgroundColor={Colors.background} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerBackTitle: 'Back',
        }}
      >
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(customer)" options={{ headerShown: false }} />
        <Stack.Screen name="(mechanic)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      </Stack>
    </ErrorBoundary>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <AppContent />
          </QueryClientProvider>
        </trpc.Provider>
      </StoreProvider>
    </ErrorBoundary>
  );
}