import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '@/constants/colors';
import { mobileDB } from '@/lib/mobile-database';
import { Database, RefreshCw, Trash2, CheckCircle, AlertTriangle } from 'lucide-react-native';

interface DatabaseStatusProps {
  showActions?: boolean;
}

export function DatabaseStatus({ showActions = false }: DatabaseStatusProps) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const dbStatus = await mobileDB.getDatabaseStatus();
      setStatus(dbStatus);
    } catch (error) {
      console.error('Error loading database status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleRefresh = () => {
    loadStatus();
  };

  const handleClearDatabase = () => {
    Alert.alert(
      'Clear Database',
      'This will remove all data and reinitialize the database. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await mobileDB.clearDatabase();
              await mobileDB.initializeIfNeeded();
              await loadStatus();
              Alert.alert('Success', 'Database cleared and reinitialized');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear database');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Database size={20} color={Colors.primary} />
          <Text style={styles.title}>Loading database status...</Text>
        </View>
      </View>
    );
  }

  const isHealthy = status?.isInitialized && status?.userCount > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Database size={20} color={Colors.primary} />
        <Text style={styles.title}>Database Status</Text>
        {isHealthy ? (
          <CheckCircle size={16} color={Colors.success} />
        ) : (
          <AlertTriangle size={16} color={Colors.warning} />
        )}
      </View>

      {status && (
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Initialized</Text>
            <Text style={[styles.statusValue, { color: status.isInitialized ? Colors.success : Colors.error }]}>
              {status.isInitialized ? 'Yes' : 'No'}
            </Text>
          </View>

          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Version</Text>
            <Text style={styles.statusValue}>{status.version}</Text>
          </View>

          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Total Users</Text>
            <Text style={styles.statusValue}>{status.userCount}</Text>
          </View>

          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Vehicles</Text>
            <Text style={styles.statusValue}>{status.vehicleCount}</Text>
          </View>

          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Admins</Text>
            <Text style={styles.statusValue}>{status.adminUsers}</Text>
          </View>

          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Mechanics</Text>
            <Text style={styles.statusValue}>{status.mechanicUsers}</Text>
          </View>

          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Customers</Text>
            <Text style={styles.statusValue}>{status.customerUsers}</Text>
          </View>
        </View>
      )}

      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleRefresh}>
            <RefreshCw size={16} color={Colors.primary} />
            <Text style={styles.actionText}>Refresh</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.dangerButton]} 
            onPress={handleClearDatabase}
          >
            <Trash2 size={16} color={Colors.white} />
            <Text style={[styles.actionText, styles.dangerText]}>Clear & Reset</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusItem: {
    flex: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dangerButton: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
  },
  dangerText: {
    color: Colors.white,
  },
});