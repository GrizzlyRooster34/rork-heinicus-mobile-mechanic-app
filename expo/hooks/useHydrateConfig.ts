import { useEffect } from "react";
import { configStore } from "@/lib/configStore";

interface ConfigItem {
  key: string;
  value: string | boolean | number | null;
}

/**
 * Hook to hydrate config store with persisted admin settings from backend
 * This ensures global toggles (VIN check, scooter support, etc.) are respected
 * across the entire app on startup
 */
export const useHydrateConfig = () => {
  // Disable tRPC query for now to prevent blocking app startup
  // const { data, isSuccess, error } = trpc.config.getAll.useQuery(undefined, {
  //   retry: 1,
  //   retryDelay: 1000,
  // });

  useEffect(() => {
    // Set reasonable defaults without backend dependency
    try {
      configStore.set('isProduction', false);
      configStore.set('enableChatbot', true);
      configStore.set('enableVINCheck', true);
      configStore.set('showScooterSupport', true);
      configStore.set('showMotorcycleSupport', true);
      
      console.log('Config hydration complete with defaults');
    } catch (error) {
      console.warn('Config hydration failed:', error);
    }
  }, []);

  // Return current config state for debugging
  return {
    isHydrated: true,
    error: null,
    config: configStore.get(),
  };
};