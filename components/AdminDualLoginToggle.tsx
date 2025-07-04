import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/auth-store';
import { ENV_CONFIG } from '@/utils/firebase-config';

export default function AdminDualLoginToggle() {
  const { login, isLoading } = useAuthStore();

  // Only show in development
  if (!ENV_CONFIG?.showQuickAccess) {
    return null;
  }

  const handleAdminLogin = async () => {
    await login('matthew.heinen.2014@gmail.com', 'RoosTer669072!@');
  };

  const handleMechanicLogin = async () => {
    await login('cody@heinicus.com', 'RoosTer669072!@');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Dev Login</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.adminButton]}
          onPress={handleAdminLogin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Admin Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.mechanicButton]}
          onPress={handleMechanicLogin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Mechanic Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: Colors.warning + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warning,
    marginBottom: 12,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  adminButton: {
    backgroundColor: Colors.error + '20',
    borderWidth: 1,
    borderColor: Colors.error,
  },
  mechanicButton: {
    backgroundColor: Colors.primary + '20',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
});