import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ConfigStore {
  // Production settings
  isProduction: boolean;
  
  // Debug settings
  showVINDebug: boolean;
  
  // Feature toggles
  enableChatbot: boolean;
  enableVINCheck: boolean;
  showScooterSupport: boolean;
  showMotorcycleSupport: boolean;
  
  // Pricing settings
  defaultLaborRate: number;
  
  // Business settings
  travelFeePerMile: number;
  minimumTravelFee: number;
  
  // Update function
  updateSetting: <K extends keyof Omit<ConfigStore, 'updateSetting'>>(
    key: K, 
    value: ConfigStore[K]
  ) => void;
}

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set) => ({
      // Default values
      isProduction: false,
      showVINDebug: false,
      enableChatbot: true,
      enableVINCheck: true,
      showScooterSupport: true,
      showMotorcycleSupport: true,
      defaultLaborRate: 95,
      travelFeePerMile: 0.65,
      minimumTravelFee: 15,
      
      updateSetting: (key, value) => set({ [key]: value }),
    }),
    {
      name: 'heinicus-config-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist certain settings
      partialize: (state) => ({
        isProduction: state.isProduction,
        showVINDebug: state.showVINDebug,
        enableChatbot: state.enableChatbot,
        enableVINCheck: state.enableVINCheck,
        showScooterSupport: state.showScooterSupport,
        showMotorcycleSupport: state.showMotorcycleSupport,
        defaultLaborRate: state.defaultLaborRate,
        travelFeePerMile: state.travelFeePerMile,
        minimumTravelFee: state.minimumTravelFee,
      }),
    }
  )
);

// Export a simple API for non-React usage
export const configStore = {
  get: () => useConfigStore.getState(),
  set: <K extends keyof Omit<ConfigStore, 'updateSetting'>>(
    key: K, 
    value: ConfigStore[K]
  ) => useConfigStore.getState().updateSetting(key, value),
};

// Helper functions for common config checks
export const isFeatureEnabled = (feature: keyof ConfigStore): boolean => {
  const config = configStore.get();
  return Boolean(config[feature]);
};

export const getLabourRate = (): number => {
  return configStore.get().defaultLaborRate;
};

export const getTravelFeeCalculation = (miles: number): number => {
  const config = configStore.get();
  const calculatedFee = miles * config.travelFeePerMile;
  return Math.max(calculatedFee, config.minimumTravelFee);
};