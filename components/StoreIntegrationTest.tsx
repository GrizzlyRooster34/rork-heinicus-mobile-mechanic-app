import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import { useAuthStore, useAppStore, useSettingsStore, useAdminSettingsStore, StoreErrorHandler } from '@/stores';
import { validateStoreState } from '@/stores/store-validators';
import * as Icons from 'lucide-react-native';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export function StoreIntegrationTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const authStore = useAuthStore();
  const appStore = useAppStore();
  const settingsStore = useSettingsStore();
  const adminSettingsStore = useAdminSettingsStore();

  const runTests = async () => {
    setIsRunning(true);
    const results: TestResult[] = [];

    // Test 1: Store State Validation
    try {
      const authValid = validateStoreState('auth', authStore);
      const appValid = validateStoreState('app', appStore);
      const settingsValid = validateStoreState('settings', settingsStore);
      const adminValid = validateStoreState('adminSettings', adminSettingsStore);

      results.push({
        name: 'Store State Validation',
        passed: authValid && appValid && settingsValid && adminValid,
        error: !authValid ? 'Auth store invalid' : 
               !appValid ? 'App store invalid' :
               !settingsValid ? 'Settings store invalid' :
               !adminValid ? 'Admin settings store invalid' : undefined
      });
    } catch (error) {
      results.push({
        name: 'Store State Validation',
        passed: false,
        error: (error as Error).message
      });
    }

    // Test 2: Auth Store Operations
    try {
      const originalUser = authStore.user;
      const testUser = {
        id: 'test-user',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'customer' as const,
        createdAt: new Date()
      };
      
      authStore.setUser(testUser);
      const userSet = authStore.user?.id === 'test-user';
      
      // Restore original state
      if (originalUser) {
        authStore.setUser(originalUser);
      }

      results.push({
        name: 'Auth Store Operations',
        passed: userSet,
        error: !userSet ? 'Failed to set user' : undefined
      });
    } catch (error) {
      results.push({
        name: 'Auth Store Operations',
        passed: false,
        error: (error as Error).message
      });
    }

    // Test 3: App Store Operations
    try {
      const testVehicle = {
        id: 'test-vehicle',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vehicleType: 'car' as const,
        mileage: 50000
      };

      const originalVehicleCount = appStore.vehicles.length;
      appStore.addVehicle(testVehicle);
      const vehicleAdded = appStore.vehicles.length === originalVehicleCount + 1;
      
      // Clean up
      appStore.removeVehicle('test-vehicle');

      results.push({
        name: 'App Store Operations',
        passed: vehicleAdded,
        error: !vehicleAdded ? 'Failed to add vehicle' : undefined
      });
    } catch (error) {
      results.push({
        name: 'App Store Operations',
        passed: false,
        error: (error as Error).message
      });
    }

    // Test 4: Settings Store Operations
    try {
      const originalAvailability = settingsStore.availability.isAvailable;
      settingsStore.updateAvailabilitySettings({ isAvailable: !originalAvailability });
      const availabilityUpdated = settingsStore.availability.isAvailable !== originalAvailability;
      
      // Restore original state
      settingsStore.updateAvailabilitySettings({ isAvailable: originalAvailability });

      results.push({
        name: 'Settings Store Operations',
        passed: availabilityUpdated,
        error: !availabilityUpdated ? 'Failed to update availability' : undefined
      });
    } catch (error) {
      results.push({
        name: 'Settings Store Operations',
        passed: false,
        error: (error as Error).message
      });
    }

    // Test 5: Admin Settings Store Operations
    try {
      const originalDebugMode = adminSettingsStore.system.enableDebugMode;
      adminSettingsStore.updateSystemSettings({ enableDebugMode: !originalDebugMode });
      const debugModeUpdated = adminSettingsStore.system.enableDebugMode !== originalDebugMode;
      
      // Restore original state
      adminSettingsStore.updateSystemSettings({ enableDebugMode: originalDebugMode });

      results.push({
        name: 'Admin Settings Store Operations',
        passed: debugModeUpdated,
        error: !debugModeUpdated ? 'Failed to update debug mode' : undefined
      });
    } catch (error) {
      results.push({
        name: 'Admin Settings Store Operations',
        passed: false,
        error: (error as Error).message
      });
    }

    // Test 6: Error Handling
    try {
      const initialErrorCount = StoreErrorHandler.getErrors().length;
      
      // This should trigger error handling (if implemented)
      try {
        // Intentionally cause an error
        throw new Error('Test error');
      } catch (error) {
        StoreErrorHandler.logError('TEST_ERROR', error as Error);
      }

      const finalErrorCount = StoreErrorHandler.getErrors().length;
      const errorHandled = finalErrorCount > initialErrorCount;

      results.push({
        name: 'Error Handling',
        passed: errorHandled,
        error: !errorHandled ? 'Error handling not working' : undefined
      });
    } catch (error) {
      results.push({
        name: 'Error Handling',
        passed: false,
        error: (error as Error).message
      });
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const clearErrors = () => {
    StoreErrorHandler.clearErrors();
    setTestResults([]);
  };

  const passedTests = testResults.filter(r => r.passed).length;
  const totalTests = testResults.length;
  const allPassed = passedTests === totalTests && totalTests > 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Icons.TestTube size={24} color={Colors.primary} />
        <Text style={styles.title}>Store Integration Tests</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.runButton]}
          onPress={runTests}
          disabled={isRunning}
        >
          {isRunning ? (
            <Icons.Loader2 size={16} color={Colors.white} />
          ) : (
            <Icons.Play size={16} color={Colors.white} />
          )}
          <Text style={styles.buttonText}>
            {isRunning ? 'Running Tests...' : 'Run Tests'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearErrors}
        >
          <Icons.Trash2 size={16} color={Colors.error} />
          <Text style={[styles.buttonText, { color: Colors.error }]}>
            Clear Errors
          </Text>
        </TouchableOpacity>
      </View>

      {testResults.length > 0 && (
        <View style={styles.results}>
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              {passedTests}/{totalTests} tests passed
            </Text>
            <View style={[
              styles.summaryBadge,
              { backgroundColor: allPassed ? Colors.success + '20' : Colors.error + '20' }
            ]}>
              {allPassed ? (
                <Icons.CheckCircle size={16} color={Colors.success} />
              ) : (
                <Icons.XCircle size={16} color={Colors.error} />
              )}
              <Text style={[
                styles.summaryBadgeText,
                { color: allPassed ? Colors.success : Colors.error }
              ]}>
                {allPassed ? 'PASSED' : 'FAILED'}
              </Text>
            </View>
          </View>

          {testResults.map((result, index) => (
            <View key={index} style={styles.testResult}>
              <View style={styles.testHeader}>
                {result.passed ? (
                  <Icons.Check size={20} color={Colors.success} />
                ) : (
                  <Icons.X size={20} color={Colors.error} />
                )}
                <Text style={styles.testName}>{result.name}</Text>
              </View>
              {result.error && (
                <Text style={styles.testError}>{result.error}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      <View style={styles.storeStatus}>
        <Text style={styles.sectionTitle}>Store Status</Text>
        
        <View style={styles.storeItem}>
          <Text style={styles.storeName}>Auth Store</Text>
          <Text style={styles.storeInfo}>
            User: {authStore.user ? `${authStore.user.firstName} (${authStore.user.role})` : 'None'} | 
            Authenticated: {authStore.isAuthenticated ? 'Yes' : 'No'}
          </Text>
        </View>

        <View style={styles.storeItem}>
          <Text style={styles.storeName}>App Store</Text>
          <Text style={styles.storeInfo}>
            Vehicles: {appStore.vehicles.length} | 
            Service Requests: {appStore.serviceRequests.length} | 
            Quotes: {appStore.quotes.length}
          </Text>
        </View>

        <View style={styles.storeItem}>
          <Text style={styles.storeName}>Settings Store</Text>
          <Text style={styles.storeInfo}>
            Available: {settingsStore.availability.isAvailable ? 'Yes' : 'No'} | 
            Labor Rate: ${settingsStore.pricing.laborRate}/hr
          </Text>
        </View>

        <View style={styles.storeItem}>
          <Text style={styles.storeName}>Admin Settings Store</Text>
          <Text style={styles.storeInfo}>
            Maintenance Mode: {adminSettingsStore.system.maintenanceMode ? 'On' : 'Off'} | 
            Debug Mode: {adminSettingsStore.system.enableDebugMode ? 'On' : 'Off'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
  },
  controls: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  runButton: {
    backgroundColor: Colors.primary,
    flex: 1,
  },
  clearButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.white,
  },
  results: {
    marginBottom: 24,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  summaryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  testResult: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  testName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  testError: {
    fontSize: 14,
    color: Colors.error,
    marginTop: 8,
    fontStyle: 'italic',
  },
  storeStatus: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  storeItem: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  storeInfo: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});