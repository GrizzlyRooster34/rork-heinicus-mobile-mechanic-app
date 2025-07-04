import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/auth-store';
import { devMode, DEV_CREDENTIALS } from '@/utils/dev';
import * as Icons from 'lucide-react-native';

export default function DevSwitcherScreen() {
  const { login, logout, user, isAuthenticated } = useAuthStore();

  const handleQuickLogin = async (role: 'admin' | 'mechanic' | 'customer') => {
    const credentials = DEV_CREDENTIALS[role];
    const success = await login(credentials.email, credentials.password);
    
    if (success) {
      Alert.alert('Success', `Logged in as ${role}`);
      // Navigate to appropriate screen
      if (role === 'admin') {
        router.replace('/(admin)');
      } else if (role === 'mechanic') {
        router.replace('/(mechanic)');
      } else {
        router.replace('/(customer)');
      }
    } else {
      Alert.alert('Error', 'Login failed');
    }
  };

  const handleLogout = () => {
    logout();
    Alert.alert('Success', 'Logged out');
    router.replace('/auth');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icons.Settings size={32} color={Colors.warning} />
        <Text style={styles.title}>Development Switcher</Text>
        <Text style={styles.subtitle}>Quick role switching for testing</Text>
      </View>

      {isAuthenticated && user && (
        <View style={styles.currentUser}>
          <Text style={styles.currentUserTitle}>Currently logged in as:</Text>
          <Text style={styles.currentUserInfo}>
            {user.firstName} {user.lastName} ({user.role})
          </Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icons.LogOut size={16} color={Colors.white} />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.roleButton, styles.adminButton]}
          onPress={() => handleQuickLogin('admin')}
        >
          <Icons.Shield size={24} color={Colors.white} />
          <Text style={styles.roleButtonText}>Login as Admin</Text>
          <Text style={styles.roleButtonSubtext}>Full system access</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleButton, styles.mechanicButton]}
          onPress={() => handleQuickLogin('mechanic')}
        >
          <Icons.Wrench size={24} color={Colors.white} />
          <Text style={styles.roleButtonText}>Login as Mechanic</Text>
          <Text style={styles.roleButtonSubtext}>Job management & tools</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleButton, styles.customerButton]}
          onPress={() => handleQuickLogin('customer')}
        >
          <Icons.User size={24} color={Colors.white} />
          <Text style={styles.roleButtonText}>Login as Customer</Text>
          <Text style={styles.roleButtonSubtext}>Request services</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Icons.ArrowLeft size={16} color={Colors.textSecondary} />
        <Text style={styles.backButtonText}>Back to Auth</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  currentUser: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  currentUserTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  currentUserInfo: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 16,
  },
  roleButton: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  adminButton: {
    backgroundColor: Colors.error,
  },
  mechanicButton: {
    backgroundColor: Colors.primary,
  },
  customerButton: {
    backgroundColor: Colors.success,
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  roleButtonSubtext: {
    fontSize: 12,
    color: Colors.white + '80',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 'auto',
    padding: 16,
    justifyContent: 'center',
  },
  backButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});