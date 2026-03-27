import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import { Button } from '@/components/Button';
import { Colors } from '@/constants/colors';
import * as Icons from 'lucide-react-native';

interface VehicleInfo {
  vin: string;
  make: string;
  model: string;
  year: number;
  engine: string;
  type: 'motorcycle' | 'scooter';
}

interface VINCheckerMotorcycleProps {
  onVehicleDetected?: (vehicle: VehicleInfo) => void;
}

export default function VINCheckerMotorcycle({ onVehicleDetected }: VINCheckerMotorcycleProps) {
  const [vin, setVin] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<VehicleInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateVIN = (vinCode: string): boolean => {
    // Basic VIN validation - 17 characters, alphanumeric except I, O, Q
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
    return vinRegex.test(vinCode);
  };

  const mockVINDecode = async (vinCode: string): Promise<VehicleInfo> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock motorcycle/scooter data based on VIN patterns
    const mockData: Record<string, VehicleInfo> = {
      'JH2RC5006LM200001': {
        vin: vinCode,
        make: 'Honda',
        model: 'CBR600RR',
        year: 2020,
        engine: '599cc Inline-4',
        type: 'motorcycle',
      },
      'JYAVP31E8LA000001': {
        vin: vinCode,
        make: 'Yamaha',
        model: 'YZF-R1',
        year: 2020,
        engine: '998cc Inline-4',
        type: 'motorcycle',
      },
      'JS1GR7JA5L2100001': {
        vin: vinCode,
        make: 'Suzuki',
        model: 'GSX-R750',
        year: 2020,
        engine: '749cc Inline-4',
        type: 'motorcycle',
      },
      'ZDMH40200L0000001': {
        vin: vinCode,
        make: 'Ducati',
        model: 'Panigale V4',
        year: 2020,
        engine: '1103cc V4',
        type: 'motorcycle',
      },
      'RFBLA4157L0000001': {
        vin: vinCode,
        make: 'Vespa',
        model: 'Primavera 150',
        year: 2020,
        engine: '150cc Single',
        type: 'scooter',
      },
    };

    // Return mock data or generate based on VIN prefix
    if (mockData[vinCode]) {
      return mockData[vinCode];
    }

    // Generate based on common manufacturer codes
    const makeMap: Record<string, string> = {
      'JH2': 'Honda',
      'JYA': 'Yamaha',
      'JS1': 'Suzuki',
      'ZDM': 'Ducati',
      'RFB': 'Vespa',
      'ML8': 'BMW',
      'WVW': 'Volkswagen', // For scooters
    };

    const prefix = vinCode.substring(0, 3);
    const make = makeMap[prefix] || 'Unknown';
    const isScooter = ['RFB', 'WVW'].includes(prefix);

    return {
      vin: vinCode,
      make,
      model: isScooter ? 'Scooter Model' : 'Motorcycle Model',
      year: 2020,
      engine: isScooter ? '150cc Single' : '600cc Inline-4',
      type: isScooter ? 'scooter' : 'motorcycle',
    };
  };

  const handleVINCheck = async () => {
    if (!vin.trim()) {
      Alert.alert('Error', 'Please enter a VIN number');
      return;
    }

    if (!validateVIN(vin.trim())) {
      Alert.alert('Invalid VIN', 'Please enter a valid 17-character VIN number');
      return;
    }

    setIsChecking(true);
    setError(null);
    setResult(null);

    try {
      const vehicleInfo = await mockVINDecode(vin.trim().toUpperCase());
      setResult(vehicleInfo);
      onVehicleDetected?.(vehicleInfo);
    } catch (error) {
      console.error('VIN decode error:', error);
      setError('Failed to decode VIN. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleClear = () => {
    setVin('');
    setResult(null);
    setError(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icons.Bike size={24} color={Colors.primary} />
        <Text style={styles.title}>Motorcycle/Scooter VIN Checker</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.vinInput}
          value={vin}
          onChangeText={setVin}
          placeholder="Enter 17-character VIN"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="characters"
          maxLength={17}
          editable={!isChecking}
        />
        <Button
          title="Clear"
          onPress={handleClear}
          variant="outline"
          style={styles.clearButton}
          disabled={!vin || isChecking}
        />
      </View>

      <Text style={styles.hint}>
        VIN is usually found on the frame, under the seat, or on registration documents
      </Text>

      <Button
        title={isChecking ? 'Checking VIN...' : 'Check VIN'}
        onPress={handleVINCheck}
        disabled={!vin || isChecking || !validateVIN(vin)}
        style={styles.checkButton}
      />

      {error && (
        <View style={styles.errorContainer}>
          <Icons.AlertCircle size={20} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {result && (
        <View style={styles.resultContainer}>
          <View style={styles.resultHeader}>
            <Icons.CheckCircle size={20} color={Colors.success} />
            <Text style={styles.resultTitle}>Vehicle Information</Text>
          </View>

          <View style={styles.resultGrid}>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Type:</Text>
              <Text style={[styles.resultValue, { color: result.type === 'motorcycle' ? Colors.primary : Colors.secondary }]}>
                {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
              </Text>
            </View>

            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Make:</Text>
              <Text style={styles.resultValue}>{result.make}</Text>
            </View>

            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Model:</Text>
              <Text style={styles.resultValue}>{result.model}</Text>
            </View>

            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Year:</Text>
              <Text style={styles.resultValue}>{result.year}</Text>
            </View>

            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Engine:</Text>
              <Text style={styles.resultValue}>{result.engine}</Text>
            </View>

            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>VIN:</Text>
              <Text style={[styles.resultValue, styles.vinValue]}>{result.vin}</Text>
            </View>
          </View>
        </View>
      )}
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
  inputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  vinInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    fontFamily: 'monospace',
  },
  clearButton: {
    paddingHorizontal: 16,
  },
  hint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 16,
    textAlign: 'center',
  },
  checkButton: {
    marginBottom: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorBackground,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: Colors.error,
    fontSize: 14,
  },
  resultContainer: {
    backgroundColor: Colors.successBackground,
    borderRadius: 8,
    padding: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
  },
  resultGrid: {
    gap: 8,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  vinValue: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});