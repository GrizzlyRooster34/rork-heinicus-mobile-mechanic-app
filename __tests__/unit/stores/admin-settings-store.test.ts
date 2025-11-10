/**
 * Unit Tests for Admin Settings Store
 */

import { renderHook, act } from '@testing-library/react-native';
import { useAdminSettingsStore } from '../../../stores/admin-settings-store';

describe('Admin Settings Store', () => {
  beforeEach(() => {
    // Reset store to defaults before each test
    const { result } = renderHook(() => useAdminSettingsStore());
    act(() => {
      result.current.resetToDefaults();
    });
  });

  describe('System Settings', () => {
    it('should have correct default system settings', () => {
      const { result } = renderHook(() => useAdminSettingsStore());

      expect(result.current.system).toEqual({
        showQuickAccess: true,
        enableDebugMode: false,
        maintenanceMode: false,
        maxConcurrentJobs: 10,
        sessionTimeout: 60,
        enableAIDiagnostics: false,
      });
    });

    it('should update system settings', () => {
      const { result } = renderHook(() => useAdminSettingsStore());

      act(() => {
        result.current.updateSystemSettings({
          enableDebugMode: true,
          maxConcurrentJobs: 20,
        });
      });

      expect(result.current.system.enableDebugMode).toBe(true);
      expect(result.current.system.maxConcurrentJobs).toBe(20);
      // Other settings should remain unchanged
      expect(result.current.system.showQuickAccess).toBe(true);
    });

    it('should toggle maintenance mode', () => {
      const { result } = renderHook(() => useAdminSettingsStore());

      expect(result.current.system.maintenanceMode).toBe(false);

      act(() => {
        result.current.toggleMaintenanceMode();
      });

      expect(result.current.system.maintenanceMode).toBe(true);

      act(() => {
        result.current.toggleMaintenanceMode();
      });

      expect(result.current.system.maintenanceMode).toBe(false);
    });
  });

  describe('Notification Settings', () => {
    it('should have correct default notification settings', () => {
      const { result } = renderHook(() => useAdminSettingsStore());

      expect(result.current.notifications).toEqual({
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
      });
    });

    it('should update notification settings', () => {
      const { result } = renderHook(() => useAdminSettingsStore());

      act(() => {
        result.current.updateNotificationSettings({
          email: {
            ...result.current.notifications.email,
            jobUpdates: false,
          },
        });
      });

      expect(result.current.notifications.email.jobUpdates).toBe(false);
      expect(result.current.notifications.email.enabled).toBe(true);
    });
  });

  describe('Security Settings', () => {
    it('should have correct default security settings', () => {
      const { result } = renderHook(() => useAdminSettingsStore());

      expect(result.current.security).toEqual({
        requireTwoFactor: false,
        allowMultipleSessions: true,
        auditLogging: true,
        passwordExpiry: 90,
        maxLoginAttempts: 5,
      });
    });

    it('should update security settings', () => {
      const { result } = renderHook(() => useAdminSettingsStore());

      act(() => {
        result.current.updateSecuritySettings({
          requireTwoFactor: true,
          maxLoginAttempts: 3,
        });
      });

      expect(result.current.security.requireTwoFactor).toBe(true);
      expect(result.current.security.maxLoginAttempts).toBe(3);
    });
  });

  describe('Data Backup Settings', () => {
    it('should have correct default backup settings', () => {
      const { result } = renderHook(() => useAdminSettingsStore());

      expect(result.current.dataBackup).toEqual({
        autoBackup: true,
        includeUserData: true,
        includeJobHistory: true,
        retentionDays: 30,
      });
    });

    it('should update backup settings', () => {
      const { result } = renderHook(() => useAdminSettingsStore());

      act(() => {
        result.current.updateDataBackupSettings({
          retentionDays: 60,
          includeUserData: false,
        });
      });

      expect(result.current.dataBackup.retentionDays).toBe(60);
      expect(result.current.dataBackup.includeUserData).toBe(false);
    });
  });

  describe('System Actions', () => {
    it('should perform backup', async () => {
      const { result } = renderHook(() => useAdminSettingsStore());

      let backupResult: boolean | undefined;

      await act(async () => {
        backupResult = await result.current.performBackup();
      });

      expect(backupResult).toBe(true);
    });

    it('should clear all sessions', async () => {
      const { result } = renderHook(() => useAdminSettingsStore());

      let clearResult: boolean | undefined;

      await act(async () => {
        clearResult = await result.current.clearAllSessions();
      });

      expect(clearResult).toBe(true);
    });

    it('should reset to defaults', () => {
      const { result } = renderHook(() => useAdminSettingsStore());

      // Change some settings
      act(() => {
        result.current.updateSystemSettings({ enableDebugMode: true });
        result.current.updateSecuritySettings({ requireTwoFactor: true });
      });

      expect(result.current.system.enableDebugMode).toBe(true);
      expect(result.current.security.requireTwoFactor).toBe(true);

      // Reset to defaults
      act(() => {
        result.current.resetToDefaults();
      });

      expect(result.current.system.enableDebugMode).toBe(false);
      expect(result.current.security.requireTwoFactor).toBe(false);
    });

    it('should get system status', () => {
      const { result } = renderHook(() => useAdminSettingsStore());

      const status = result.current.getSystemStatus();

      expect(status).toHaveProperty('systemHealth');
      expect(status).toHaveProperty('maintenanceMode');
      expect(status).toHaveProperty('activeUsers');
      expect(status).toHaveProperty('lastBackup');
      expect(status).toHaveProperty('uptime');

      expect(status.systemHealth).toBe('healthy');
      expect(status.maintenanceMode).toBe(false);
      expect(typeof status.activeUsers).toBe('number');
      expect(typeof status.uptime).toBe('number');
    });

    it('should show warning system health when in maintenance mode', () => {
      const { result } = renderHook(() => useAdminSettingsStore());

      act(() => {
        result.current.toggleMaintenanceMode();
      });

      const status = result.current.getSystemStatus();

      expect(status.systemHealth).toBe('warning');
      expect(status.maintenanceMode).toBe(true);
    });
  });
});
