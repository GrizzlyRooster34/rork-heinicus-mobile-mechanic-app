import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SystemSettings {
  showQuickAccess: boolean;
  enableDebugMode: boolean;
  maintenanceMode: boolean;
  maxConcurrentJobs: number;
  sessionTimeout: number; // minutes
}

interface NotificationSettings {
  email: {
    enabled: boolean;
    newJobs: boolean;
    jobUpdates: boolean;
    systemAlerts: boolean;
  };
  push: {
    enabled: boolean;
    newJobs: boolean;
    jobUpdates: boolean;
    systemAlerts: boolean;
  };
  sms: {
    enabled: boolean;
    emergencyOnly: boolean;
  };
}

interface SecuritySettings {
  requireTwoFactor: boolean;
  allowMultipleSessions: boolean;
  auditLogging: boolean;
  passwordExpiry: number; // days
  maxLoginAttempts: number;
}

interface DataBackupSettings {
  autoBackup: boolean;
  includeUserData: boolean;
  includeJobHistory: boolean;
  retentionDays: number;
}

interface SystemStatus {
  systemHealth: 'healthy' | 'warning' | 'critical';
  maintenanceMode: boolean;
  activeUsers: number;
  lastBackup: Date | null;
  uptime: number; // hours
}

interface AdminSettingsStore {
  system: SystemSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  dataBackup: DataBackupSettings;
  
  // Actions
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => void;
  updateDataBackupSettings: (settings: Partial<DataBackupSettings>) => void;
  
  // System actions
  toggleMaintenanceMode: () => void;
  performBackup: () => Promise<boolean>;
  clearAllSessions: () => Promise<boolean>;
  resetToDefaults: () => void;
  getSystemStatus: () => SystemStatus;
}

const defaultSystemSettings: SystemSettings = {
  showQuickAccess: true,
  enableDebugMode: false,
  maintenanceMode: false,
  maxConcurrentJobs: 10,
  sessionTimeout: 60,
};

const defaultNotificationSettings: NotificationSettings = {
  email: {
    enabled: true,
    newJobs: true,
    jobUpdates: true,
    systemAlerts: true,
  },
  push: {
    enabled: true,
    newJobs: true,
    jobUpdates: false,
    systemAlerts: true,
  },
  sms: {
    enabled: false,
    emergencyOnly: true,
  },
};

const defaultSecuritySettings: SecuritySettings = {
  requireTwoFactor: false,
  allowMultipleSessions: true,
  auditLogging: true,
  passwordExpiry: 90,
  maxLoginAttempts: 5,
};

const defaultDataBackupSettings: DataBackupSettings = {
  autoBackup: true,
  includeUserData: true,
  includeJobHistory: true,
  retentionDays: 30,
};

export const useAdminSettingsStore = create<AdminSettingsStore>()(
  persist(
    (set, get) => ({
      system: defaultSystemSettings,
      notifications: defaultNotificationSettings,
      security: defaultSecuritySettings,
      dataBackup: defaultDataBackupSettings,

      updateSystemSettings: (settings) => {
        set((state) => ({
          system: { ...state.system, ...settings }
        }));
        
        console.log('System settings updated:', settings);
      },

      updateNotificationSettings: (settings) => {
        set((state) => ({
          notifications: { ...state.notifications, ...settings }
        }));
        
        console.log('Notification settings updated:', settings);
      },

      updateSecuritySettings: (settings) => {
        set((state) => ({
          security: { ...state.security, ...settings }
        }));
        
        console.log('Security settings updated:', settings);
      },

      updateDataBackupSettings: (settings) => {
        set((state) => ({
          dataBackup: { ...state.dataBackup, ...settings }
        }));
        
        console.log('Data backup settings updated:', settings);
      },

      toggleMaintenanceMode: () => {
        set((state) => ({
          system: {
            ...state.system,
            maintenanceMode: !state.system.maintenanceMode
          }
        }));
        
        const newState = get().system.maintenanceMode;
        console.log('Maintenance mode toggled:', newState ? 'ON' : 'OFF');
        
        // In a real app, this would notify all users and prevent new logins
        if (newState) {
          console.log('🚧 System entering maintenance mode - new logins disabled');
        } else {
          console.log('✅ System exiting maintenance mode - normal operations resumed');
        }
      },

      performBackup: async () => {
        console.log('🔄 Starting system backup...');
        
        try {
          // Simulate backup process
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // In a real app, this would:
          // 1. Export all user data
          // 2. Export all job/quote data
          // 3. Export system settings
          // 4. Upload to cloud storage
          // 5. Update backup timestamp
          
          console.log('✅ System backup completed successfully');
          return true;
        } catch (error) {
          console.error('❌ System backup failed:', error);
          return false;
        }
      },

      clearAllSessions: async () => {
        console.log('🔄 Clearing all user sessions...');
        
        try {
          // Simulate session clearing
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // In a real app, this would:
          // 1. Invalidate all JWT tokens
          // 2. Clear all session data
          // 3. Force logout on all devices
          // 4. Log security event
          
          console.log('✅ All user sessions cleared successfully');
          return true;
        } catch (error) {
          console.error('❌ Failed to clear sessions:', error);
          return false;
        }
      },

      resetToDefaults: () => {
        set({
          system: defaultSystemSettings,
          notifications: defaultNotificationSettings,
          security: defaultSecuritySettings,
          dataBackup: defaultDataBackupSettings,
        });
        
        console.log('🔄 All admin settings reset to defaults');
      },

      getSystemStatus: (): SystemStatus => {
        const state = get();
        
        // Mock system status - in a real app, this would come from monitoring
        return {
          systemHealth: state.system.maintenanceMode ? 'warning' : 'healthy',
          maintenanceMode: state.system.maintenanceMode,
          activeUsers: Math.floor(Math.random() * 50) + 10, // Mock active users
          lastBackup: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random within last week
          uptime: Math.floor(Math.random() * 720) + 24, // Random uptime in hours
        };
      },
    }),
    {
      name: 'heinicus-admin-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);