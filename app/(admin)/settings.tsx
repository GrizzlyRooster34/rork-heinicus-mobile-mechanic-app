import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/auth-store';
import { useAdminSettingsStore } from '@/stores/admin-settings-store';
import { useConfigStore } from '@/lib/configStore';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/Button';
import * as Icons from 'lucide-react-native';

type ConfigKey = 'isProduction' | 'showVINDebug' | 'enableChatbot' | 'defaultLaborRate' | 'showScooterSupport' | 'showMotorcycleSupport' | 'enableVINCheck';

export default function AdminSettingsScreen() {
  const { user, logout, getAllUsers, updateUserRole } = useAuthStore();
  const {
    system,
    notifications,
    security,
    dataBackup,
    updateSystemSettings,
    updateNotificationSettings,
    updateSecuritySettings,
    updateDataBackupSettings,
    toggleMaintenanceMode,
    performBackup,
    clearAllSessions,
    resetToDefaults,
    getSystemStatus,
  } = useAdminSettingsStore();

  const config = useConfigStore();
  const updateConfigMutation = trpc.admin.updateConfig.useMutation({
    onSuccess: (data) => {
      console.log('Config updated successfully:', data);
    },
    onError: (error) => {
      console.error('Failed to update config:', error);
      Alert.alert('Error', 'Failed to update setting. Please try again.');
    },
  });

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isPerformingBackup, setIsPerformingBackup] = useState(false);

  const systemStatus = getSystemStatus();

  const handleConfigUpdate = async (key: ConfigKey, value: any) => {
    try {
      // Update local state immediately for better UX
      config.updateSetting(key, value);
      
      // Persist to backend
      await updateConfigMutation.mutateAsync({
        key: key as string,
        value: value
      });
      
      console.log(`Config updated: ${key} = ${value}`);
    } catch (error) {
      console.error('Failed to update config:', error);
      
      // Revert local state on error
      config.updateSetting(key, !value);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleBackup = async () => {
    setIsPerformingBackup(true);
    const success = await performBackup();
    setIsPerformingBackup(false);
    
    if (success) {
      Alert.alert('Backup Complete', 'System backup has been completed successfully.');
    } else {
      Alert.alert('Backup Failed', 'Failed to complete system backup. Please try again.');
    }
  };

  const handleClearSessions = () => {
    Alert.alert(
      'Clear All Sessions',
      'This will log out all users from all devices. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Sessions',
          style: 'destructive',
          onPress: async () => {
            const success = await clearAllSessions();
            if (success) {
              Alert.alert('Sessions Cleared', 'All user sessions have been cleared.');
            } else {
              Alert.alert('Error', 'Failed to clear sessions. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset to Defaults',
      'This will reset all admin settings to their default values. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetToDefaults();
            Alert.alert('Settings Reset', 'All settings have been reset to defaults.');
          },
        },
      ]
    );
  };

  const handleUserRoleUpdate = () => {
    const users = getAllUsers();
    
    Alert.alert(
      'User Management',
      `Found ${users.length} users in the system. This feature allows you to update user roles.`,
      [
        { text: 'OK' }
      ]
    );
  };

  if (user?.role !== 'admin') {
    return (
      <View style={styles.unauthorizedContainer}>
        <Icons.Shield size={64} color={Colors.error} />
        <Text style={styles.unauthorizedTitle}>Access Denied</Text>
        <Text style={styles.unauthorizedText}>
          You do not have permission to access admin settings.
        </Text>
      </View>
    );
  }

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Text>
            </View>
            <View style={styles.adminBadge}>
              <Icons.Shield size={12} color={Colors.white} />
            </View>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.firstName} {user?.lastName}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Icons.Shield size={12} color={Colors.error} />
              <Text style={styles.roleText}>Administrator</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icons.LogOut size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>

        {/* System Status */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>System Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Health</Text>
              <View style={[styles.statusBadge, { backgroundColor: 
                systemStatus.systemHealth === 'healthy' ? Colors.success + '20' :
                systemStatus.systemHealth === 'warning' ? Colors.warning + '20' :
                Colors.error + '20'
              }]}>
                <Text style={[styles.statusBadgeText, { color:
                  systemStatus.systemHealth === 'healthy' ? Colors.success :
                  systemStatus.systemHealth === 'warning' ? Colors.warning :
                  Colors.error
                }]}>
                  {systemStatus.systemHealth.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Maintenance Mode</Text>
              <Text style={styles.statusValue}>
                {systemStatus.maintenanceMode ? 'ACTIVE' : 'INACTIVE'}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Active Users</Text>
              <Text style={styles.statusValue}>{systemStatus.activeUsers}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Last Backup</Text>
              <Text style={styles.statusValue}>
                {systemStatus.lastBackup 
                  ? systemStatus.lastBackup.toLocaleDateString()
                  : 'Never'
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Global Configuration */}
        <View style={styles.settingsSection}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('config')}
          >
            <View style={styles.sectionHeaderLeft}>
              <Icons.Cog size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Global Configuration</Text>
            </View>
            <Icons.ChevronDown 
              size={20} 
              color={Colors.textMuted}
              style={[
                styles.chevron,
                activeSection === 'config' && styles.chevronRotated
              ]}
            />
          </TouchableOpacity>
          
          {activeSection === 'config' && (
            <View style={styles.sectionContent}>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Production Mode</Text>
                <Switch
                  value={config.isProduction}
                  onValueChange={(value) => handleConfigUpdate('isProduction', value)}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  disabled={updateConfigMutation.isPending}
                />
              </View>
              
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Show VIN Debug</Text>
                <Switch
                  value={config.showVINDebug}
                  onValueChange={(value) => handleConfigUpdate('showVINDebug', value)}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  disabled={updateConfigMutation.isPending}
                />
              </View>
              
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Enable Chatbot</Text>
                <Switch
                  value={config.enableChatbot}
                  onValueChange={(value) => handleConfigUpdate('enableChatbot', value)}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  disabled={updateConfigMutation.isPending}
                />
              </View>
              
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Scooter Support</Text>
                <Switch
                  value={config.showScooterSupport}
                  onValueChange={(value) => handleConfigUpdate('showScooterSupport', value)}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  disabled={updateConfigMutation.isPending}
                />
              </View>
              
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Motorcycle Support</Text>
                <Switch
                  value={config.showMotorcycleSupport}
                  onValueChange={(value) => handleConfigUpdate('showMotorcycleSupport', value)}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  disabled={updateConfigMutation.isPending}
                />
              </View>
              
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>VIN Check</Text>
                <Switch
                  value={config.enableVINCheck}
                  onValueChange={(value) => handleConfigUpdate('enableVINCheck', value)}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  disabled={updateConfigMutation.isPending}
                />
              </View>
              
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Default Labor Rate</Text>
                <Text style={styles.settingValue}>${config.defaultLaborRate}/hr</Text>
              </View>
            </View>
          )}
        </View>

        {/* System Settings */}
        <View style={styles.settingsSection}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('system')}
          >
            <View style={styles.sectionHeaderLeft}>
              <Icons.Settings size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>System Settings</Text>
            </View>
            <Icons.ChevronDown 
              size={20} 
              color={Colors.textMuted}
              style={[
                styles.chevron,
                activeSection === 'system' && styles.chevronRotated
              ]}
            />
          </TouchableOpacity>
          
          {activeSection === 'system' && (
            <View style={styles.sectionContent}>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Show Quick Access</Text>
                <Switch
                  value={system.showQuickAccess}
                  onValueChange={(value) => updateSystemSettings({ showQuickAccess: value })}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                />
              </View>
              
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Debug Mode</Text>
                <Switch
                  value={system.enableDebugMode}
                  onValueChange={(value) => updateSystemSettings({ enableDebugMode: value })}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                />
              </View>
              
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Maintenance Mode</Text>
                <Switch
                  value={system.maintenanceMode}
                  onValueChange={toggleMaintenanceMode}
                  trackColor={{ false: Colors.border, true: Colors.warning }}
                />
              </View>
            </View>
          )}
        </View>

        {/* Notification Settings */}
        <View style={styles.settingsSection}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('notifications')}
          >
            <View style={styles.sectionHeaderLeft}>
              <Icons.Bell size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Notification Settings</Text>
            </View>
            <Icons.ChevronDown 
              size={20} 
              color={Colors.textMuted}
              style={[
                styles.chevron,
                activeSection === 'notifications' && styles.chevronRotated
              ]}
            />
          </TouchableOpacity>
          
          {activeSection === 'notifications' && (
            <View style={styles.sectionContent}>
              <Text style={styles.subsectionTitle}>Email Notifications</Text>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Email Enabled</Text>
                <Switch
                  value={notifications.email.enabled}
                  onValueChange={(value) => updateNotificationSettings({
                    email: { ...notifications.email, enabled: value }
                  })}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                />
              </View>
              
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>New Jobs</Text>
                <Switch
                  value={notifications.email.newJobs}
                  onValueChange={(value) => updateNotificationSettings({
                    email: { ...notifications.email, newJobs: value }
                  })}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                />
              </View>
              
              <Text style={styles.subsectionTitle}>Push Notifications</Text>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Push Enabled</Text>
                <Switch
                  value={notifications.push.enabled}
                  onValueChange={(value) => updateNotificationSettings({
                    push: { ...notifications.push, enabled: value }
                  })}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                />
              </View>
            </View>
          )}
        </View>

        {/* Data Backup */}
        <View style={styles.settingsSection}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('backup')}
          >
            <View style={styles.sectionHeaderLeft}>
              <Icons.Database size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Data Backup</Text>
            </View>
            <Icons.ChevronDown 
              size={20} 
              color={Colors.textMuted}
              style={[
                styles.chevron,
                activeSection === 'backup' && styles.chevronRotated
              ]}
            />
          </TouchableOpacity>
          
          {activeSection === 'backup' && (
            <View style={styles.sectionContent}>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Auto Backup</Text>
                <Switch
                  value={dataBackup.autoBackup}
                  onValueChange={(value) => updateDataBackupSettings({ autoBackup: value })}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                />
              </View>
              
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Include User Data</Text>
                <Switch
                  value={dataBackup.includeUserData}
                  onValueChange={(value) => updateDataBackupSettings({ includeUserData: value })}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                />
              </View>
              
              <Button
                title={isPerformingBackup ? 'Creating Backup...' : 'Create Backup Now'}
                onPress={handleBackup}
                disabled={isPerformingBackup}
                style={styles.actionButton}
              />
            </View>
          )}
        </View>

        {/* Security Settings */}
        <View style={styles.settingsSection}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('security')}
          >
            <View style={styles.sectionHeaderLeft}>
              <Icons.Shield size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Security Settings</Text>
            </View>
            <Icons.ChevronDown 
              size={20} 
              color={Colors.textMuted}
              style={[
                styles.chevron,
                activeSection === 'security' && styles.chevronRotated
              ]}
            />
          </TouchableOpacity>
          
          {activeSection === 'security' && (
            <View style={styles.sectionContent}>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Require Two-Factor Auth</Text>
                <Switch
                  value={security.requireTwoFactor}
                  onValueChange={(value) => updateSecuritySettings({ requireTwoFactor: value })}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                />
              </View>
              
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Allow Multiple Sessions</Text>
                <Switch
                  value={security.allowMultipleSessions}
                  onValueChange={(value) => updateSecuritySettings({ allowMultipleSessions: value })}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                />
              </View>
              
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Audit Logging</Text>
                <Switch
                  value={security.auditLogging}
                  onValueChange={(value) => updateSecuritySettings({ auditLogging: value })}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                />
              </View>
              
              <Button
                title="Manage User Roles"
                variant="outline"
                onPress={handleUserRoleUpdate}
                style={styles.actionButton}
              />
              
              <Button
                title="Clear All Sessions"
                variant="outline"
                onPress={handleClearSessions}
                style={[styles.actionButton, { borderColor: Colors.error }]}
                textStyle={{ color: Colors.error }}
              />
            </View>
          )}
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <Button
            title="Reset All Settings"
            variant="outline"
            onPress={handleResetSettings}
            style={[styles.actionButton, { borderColor: Colors.error }]}
            textStyle={{ color: Colors.error }}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
  },
  unauthorizedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: Colors.background,
  },
  unauthorizedTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  unauthorizedText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.error + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.error,
  },
  adminBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.card,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '20',
    borderWidth: 1,
    borderColor: Colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  roleText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 8,
  },
  statusSection: {
    marginBottom: 24,
  },
  statusCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statusLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statusValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  settingsSection: {
    marginBottom: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  settingValue: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  actionButton: {
    marginTop: 16,
  },
  dangerSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: Colors.error + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
    marginBottom: 12,
  },
});