import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Alert } from 'react-native';
import { Colors } from '@/constants/colors';
import * as Icons from 'lucide-react-native';

interface PushNotificationConfigProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function PushNotificationConfig({
  enabled,
  onToggle,
}: PushNotificationConfigProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async (value: boolean) => {
    setIsUpdating(true);
    
    try {
      // Simulate API call to update notification preferences
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onToggle(value);
      
      Alert.alert(
        'Notification Settings Updated',
        value 
          ? 'Push notifications have been enabled. You will receive updates about jobs, payments, and system alerts.'
          : 'Push notifications have been disabled. You can re-enable them anytime in settings.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      Alert.alert('Error', 'Failed to update notification settings. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icons.Bell size={20} color={Colors.primary} />
        <Text style={styles.title}>Push Notifications</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Enable Push Notifications</Text>
            <Text style={styles.settingDescription}>
              Receive notifications for new jobs, payment confirmations, and important updates
            </Text>
          </View>
          
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            disabled={isUpdating}
            trackColor={{ 
              false: Colors.border, 
              true: Colors.primary + '40' 
            }}
            thumbColor={enabled ? Colors.primary : Colors.textMuted}
          />
        </View>
        
        {enabled && (
          <View style={styles.notificationTypes}>
            <Text style={styles.typesTitle}>You will receive notifications for:</Text>
            
            <View style={styles.typesList}>
              <View style={styles.typeItem}>
                <Icons.Briefcase size={16} color={Colors.success} />
                <Text style={styles.typeText}>New job assignments</Text>
              </View>
              
              <View style={styles.typeItem}>
                <Icons.DollarSign size={16} color={Colors.success} />
                <Text style={styles.typeText}>Payment confirmations</Text>
              </View>
              
              <View style={styles.typeItem}>
                <Icons.MessageSquare size={16} color={Colors.success} />
                <Text style={styles.typeText}>Customer messages</Text>
              </View>
              
              <View style={styles.typeItem}>
                <Icons.AlertTriangle size={16} color={Colors.warning} />
                <Text style={styles.typeText}>System alerts</Text>
              </View>
              
              <View style={styles.typeItem}>
                <Icons.Calendar size={16} color={Colors.primary} />
                <Text style={styles.typeText}>Schedule reminders</Text>
              </View>
            </View>
          </View>
        )}
      </View>
      
      <View style={styles.note}>
        <Icons.Info size={14} color={Colors.textMuted} />
        <Text style={styles.noteText}>
          Push notifications require device permissions. 
          You can manage detailed notification settings in your device's system settings.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    margin: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  content: {
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  notificationTypes: {
    marginTop: 20,
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 8,
  },
  typesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  typesList: {
    gap: 8,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
});