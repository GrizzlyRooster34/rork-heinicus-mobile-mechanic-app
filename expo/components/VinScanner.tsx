import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { VinData, VehicleType } from '@/types/service';
import * as Icons from 'lucide-react-native';

interface VinScannerProps {
  onVinScanned: (vinData: VinData) => void;
  onClose: () => void;
}

export function VinScanner({ onVinScanned, onClose }: VinScannerProps) {
  const [vinInput, setVinInput] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodedData, setDecodedData] = useState<VinData | null>(null);
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType>('car');

  const validateVin = (vin: string, vehicleType: VehicleType): boolean => {
    if (vehicleType === 'car') {
      // Standard 17-character VIN for cars
      const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
      return vinRegex.test(vin.toUpperCase());
    } else {
      // Motorcycles and scooters can have 11-17 character VINs
      const vinRegex = /^[A-HJ-NPR-Z0-9]{11,17}$/;
      return vinRegex.test(vin.toUpperCase());
    }
  };

  const decodeVin = async (vin: string) => {
    if (!validateVin(vin, selectedVehicleType)) {
      const minLength = selectedVehicleType === 'car' ? 17 : 11;
      const maxLength = 17;
      Alert.alert(
        'Invalid VIN', 
        `Please enter a valid ${minLength}${minLength !== maxLength ? `-${maxLength}` : ''} character VIN number for ${selectedVehicleType}.`
      );
      return;
    }

    setIsDecoding(true);
    setDecodedData(null);

    try {
      let vinData: VinData | null = null;

      if (vin.length === 17) {
        // Try NHTSA API for 17-character VINs
        try {
          const response = await fetch(
            `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin.toUpperCase()}?format=json`
          );

          if (response.ok) {
            const data = await response.json();
            
            if (data.Results && data.Results.length > 0) {
              const results = data.Results;
              const getValue = (variableName: string) => {
                const result = results.find((r: any) => r.Variable === variableName);
                return result?.Value || '';
              };

              const make = getValue('Make');
              const model = getValue('Model');
              const year = parseInt(getValue('Model Year')) || new Date().getFullYear();
              
              if (make && model) {
                // Determine vehicle type from NHTSA data
                const bodyClass = getValue('Body Class').toLowerCase();
                const vehicleType = getValue('Vehicle Type').toLowerCase();
                
                let detectedVehicleType: VehicleType = 'car';
                if (bodyClass.includes('motorcycle') || vehicleType.includes('motorcycle')) {
                  detectedVehicleType = 'motorcycle';
                } else if (bodyClass.includes('scooter') || vehicleType.includes('scooter') || 
                          bodyClass.includes('moped') || vehicleType.includes('moped')) {
                  detectedVehicleType = 'scooter';
                }

                vinData = {
                  vin: vin.toUpperCase(),
                  make,
                  model,
                  year,
                  vehicleType: detectedVehicleType,
                  trim: getValue('Trim') || undefined,
                  engine: getValue('Engine Model') || getValue('Engine Configuration') || undefined,
                  transmission: getValue('Transmission Style') || undefined,
                  bodyStyle: getValue('Body Class') || undefined,
                  fuelType: getValue('Fuel Type - Primary') || undefined,
                  driveType: getValue('Drive Type') || undefined,
                };
              }
            }
          }
        } catch (error) {
          console.log('NHTSA API failed, trying fallback');
        }
      }

      // Fallback to motorcycle/scooter prefix matching or basic VIN parsing
      if (!vinData) {
        vinData = generateFallbackVinData(vin, selectedVehicleType);
      }

      if (vinData) {
        setDecodedData(vinData);
      } else {
        Alert.alert(
          'VIN Decode Failed',
          'Unable to decode VIN. Please check the VIN number and try again, or enter vehicle information manually.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('VIN decode error:', error);
      
      const fallbackData = generateFallbackVinData(vin, selectedVehicleType);
      if (fallbackData) {
        setDecodedData(fallbackData);
        Alert.alert(
          'Limited VIN Data',
          'VIN decoder service is unavailable. Using basic VIN information. Please verify vehicle details.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'VIN Decode Failed',
          'Unable to decode VIN. Please check the VIN number and try again, or enter vehicle information manually.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsDecoding(false);
    }
  };

  const generateFallbackVinData = (vin: string, vehicleType: VehicleType): VinData | null => {
    try {
      const vinUpper = vin.toUpperCase();
      let year = new Date().getFullYear();
      let make = 'Unknown';
      let model = 'Unknown Model';

      // Try to extract year from VIN (10th character for 17-digit VINs)
      if (vin.length === 17) {
        const yearChar = vinUpper.charAt(9);
        const yearMap: Record<string, number> = {
          'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
          'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
          'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024,
          '1': 2001, '2': 2002, '3': 2003, '4': 2004, '5': 2005,
          '6': 2006, '7': 2007, '8': 2008, '9': 2009,
        };
        year = yearMap[yearChar] || year;
      }

      // Motorcycle and scooter manufacturer prefix mapping
      if (vehicleType === 'motorcycle' || vehicleType === 'scooter') {
        const motorcycleMap: Record<string, { make: string; type: VehicleType }> = {
          '1HD': { make: 'Harley-Davidson', type: 'motorcycle' },
          'JH2': { make: 'Honda', type: 'motorcycle' },
          'JH3': { make: 'Honda', type: 'motorcycle' },
          'JHM': { make: 'Honda', type: 'motorcycle' },
          'JKA': { make: 'Kawasaki', type: 'motorcycle' },
          'JKB': { make: 'Kawasaki', type: 'motorcycle' },
          'JS1': { make: 'Suzuki', type: 'motorcycle' },
          'JS2': { make: 'Suzuki', type: 'motorcycle' },
          'JYA': { make: 'Yamaha', type: 'motorcycle' },
          'JYB': { make: 'Yamaha', type: 'motorcycle' },
          'L5Y': { make: 'TaoTao', type: 'scooter' },
          'L6T': { make: 'Kymco', type: 'scooter' },
          'LVV': { make: 'Vespa', type: 'scooter' },
          'ME4': { make: 'KTM', type: 'motorcycle' },
          'ZAP': { make: 'Piaggio', type: 'scooter' },
          'VTH': { make: 'Triumph', type: 'motorcycle' },
          'WVB': { make: 'BMW', type: 'motorcycle' },
          '93M': { make: 'Indian', type: 'motorcycle' },
          '5J6': { make: 'Yamaha', type: 'scooter' },
          'RF9': { make: 'Aprilia', type: 'motorcycle' },
          'ZD3': { make: 'Ducati', type: 'motorcycle' },
        };

        // Check first 3 characters
        const prefix3 = vinUpper.substring(0, 3);
        if (motorcycleMap[prefix3]) {
          make = motorcycleMap[prefix3].make;
          vehicleType = motorcycleMap[prefix3].type;
        } else {
          // Check first 2 characters for some manufacturers
          const prefix2 = vinUpper.substring(0, 2);
          const shortPrefixMap: Record<string, { make: string; type: VehicleType }> = {
            'JH': { make: 'Honda', type: 'motorcycle' },
            'JK': { make: 'Kawasaki', type: 'motorcycle' },
            'JS': { make: 'Suzuki', type: 'motorcycle' },
            'JY': { make: 'Yamaha', type: 'motorcycle' },
            'L5': { make: 'Chinese Manufacturer', type: 'scooter' },
            'L6': { make: 'Chinese Manufacturer', type: 'scooter' },
          };
          
          if (shortPrefixMap[prefix2]) {
            make = shortPrefixMap[prefix2].make;
            vehicleType = shortPrefixMap[prefix2].type;
          }
        }
      } else {
        // Car manufacturer mapping (existing logic)
        const wmi = vinUpper.substring(0, 3);
        const manufacturerMap: Record<string, string> = {
          '1G1': 'Chevrolet', '1G6': 'Cadillac', '1GC': 'Chevrolet',
          '1FA': 'Ford', '1FB': 'Ford', '1FC': 'Ford', '1FD': 'Ford',
          '1FT': 'Ford', '1FU': 'Ford', '1FV': 'Ford',
          '1HG': 'Honda', '1HT': 'Honda',
          '1J4': 'Jeep', '1J8': 'Jeep',
          '1N4': 'Nissan', '1N6': 'Nissan',
          '2C3': 'Chrysler', '2C4': 'Chrysler',
          '2G1': 'Chevrolet', '2G2': 'Pontiac',
          '2T1': 'Toyota', '2T2': 'Toyota',
          '3FA': 'Ford', '3FE': 'Ford',
          '4F2': 'Mazda', '4F4': 'Mazda',
          '4T1': 'Toyota', '4T3': 'Toyota',
          '5NP': 'Hyundai', '5TD': 'Toyota',
          'JH4': 'Acura', 'JHM': 'Honda',
          'JM1': 'Mazda', 'JM3': 'Mazda',
          'JN1': 'Nissan', 'JN8': 'Nissan',
          'JT2': 'Toyota', 'JT3': 'Toyota',
          'KM8': 'Hyundai', 'KNA': 'Kia',
          'WBA': 'BMW', 'WBS': 'BMW',
          'WDB': 'Mercedes-Benz', 'WDD': 'Mercedes-Benz',
          'WVW': 'Volkswagen', 'WV1': 'Volkswagen',
        };
        make = manufacturerMap[wmi] || 'Unknown';
      }

      return {
        vin: vinUpper,
        make,
        model,
        year,
        vehicleType,
        trim: undefined,
        engine: undefined,
        transmission: undefined,
        bodyStyle: undefined,
        fuelType: undefined,
        driveType: undefined,
      };
    } catch (error) {
      return null;
    }
  };

  const handleConfirm = () => {
    if (decodedData) {
      onVinScanned(decodedData);
    }
  };

  const handleManualEntry = () => {
    Alert.alert(
      'Manual Entry',
      'Please add your vehicle information manually in the vehicle selection section.',
      [{ text: 'OK', onPress: onClose }]
    );
  };

  const getVehicleTypeIcon = (type: VehicleType) => {
    switch (type) {
      case 'motorcycle': return 'Bike';
      case 'scooter': return 'Zap';
      case 'car': return 'Car';
      default: return 'Car';
    }
  };

  const getVehicleTypeLabel = (type: VehicleType) => {
    switch (type) {
      case 'motorcycle': return 'Motorcycle';
      case 'scooter': return 'Scooter/Moped';
      case 'car': return 'Car/Truck';
      default: return 'Car/Truck';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>VIN Scanner</Text>
        <Button
          title="Close"
          variant="outline"
          size="small"
          onPress={onClose}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Vehicle Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Type</Text>
          <Text style={styles.sectionSubtitle}>
            Select your vehicle type for accurate VIN validation
          </Text>
          
          <View style={styles.vehicleTypeGrid}>
            {(['car', 'motorcycle', 'scooter'] as VehicleType[]).map((type) => {
              const IconComponent = Icons[getVehicleTypeIcon(type) as keyof typeof Icons] as any;
              
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.vehicleTypeOption,
                    selectedVehicleType === type && styles.selectedVehicleTypeOption
                  ]}
                  onPress={() => setSelectedVehicleType(type)}
                >
                  <IconComponent 
                    size={24} 
                    color={selectedVehicleType === type ? Colors.primary : Colors.textMuted} 
                  />
                  <Text style={[
                    styles.vehicleTypeText,
                    selectedVehicleType === type && styles.selectedVehicleTypeText
                  ]}>
                    {getVehicleTypeLabel(type)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enter VIN Number</Text>
          <Text style={styles.sectionSubtitle}>
            {selectedVehicleType === 'car' 
              ? 'Enter the 17-character VIN found on your vehicle\'s dashboard or door frame'
              : `Enter the ${selectedVehicleType} VIN (11-17 characters) found on the frame or registration`
            }
          </Text>
          
          <TextInput
            style={styles.vinInput}
            value={vinInput}
            onChangeText={(text) => setVinInput(text.toUpperCase())}
            placeholder={selectedVehicleType === 'car' ? 'Enter 17-character VIN' : 'Enter 11-17 character VIN'}
            placeholderTextColor={Colors.textMuted}
            maxLength={17}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <View style={styles.vinActions}>
            <Button
              title="Decode VIN"
              onPress={() => decodeVin(vinInput)}
              disabled={vinInput.length < (selectedVehicleType === 'car' ? 17 : 11) || isDecoding}
              style={styles.decodeButton}
            />
            <Button
              title="Enter Manually"
              variant="outline"
              onPress={handleManualEntry}
              style={styles.manualButton}
            />
          </View>
        </View>

        {isDecoding && (
          <View style={styles.loadingSection}>
            <LoadingSpinner />
            <Text style={styles.loadingText}>Decoding VIN...</Text>
          </View>
        )}

        {decodedData && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
            
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View style={styles.vehicleTypeIndicator}>
                  {(() => {
                    const IconComponent = Icons[getVehicleTypeIcon(decodedData.vehicleType) as keyof typeof Icons] as any;
                    return <IconComponent size={24} color={Colors.primary} />;
                  })()}
                  <Text style={styles.vehicleTypeBadge}>
                    {getVehicleTypeLabel(decodedData.vehicleType)}
                  </Text>
                </View>
                <Text style={styles.resultTitle}>
                  {decodedData.year} {decodedData.make} {decodedData.model}
                </Text>
              </View>

              <View style={styles.resultDetails}>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>VIN:</Text>
                  <Text style={styles.resultValue}>{decodedData.vin}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Type:</Text>
                  <Text style={styles.resultValue}>{getVehicleTypeLabel(decodedData.vehicleType)}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Year:</Text>
                  <Text style={styles.resultValue}>{decodedData.year}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Make:</Text>
                  <Text style={styles.resultValue}>{decodedData.make}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Model:</Text>
                  <Text style={styles.resultValue}>{decodedData.model}</Text>
                </View>
                {decodedData.trim && (
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Trim:</Text>
                    <Text style={styles.resultValue}>{decodedData.trim}</Text>
                  </View>
                )}
                {decodedData.engine && (
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Engine:</Text>
                    <Text style={styles.resultValue}>{decodedData.engine}</Text>
                  </View>
                )}
                {decodedData.transmission && (
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Transmission:</Text>
                    <Text style={styles.resultValue}>{decodedData.transmission}</Text>
                  </View>
                )}
                {decodedData.fuelType && (
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Fuel Type:</Text>
                    <Text style={styles.resultValue}>{decodedData.fuelType}</Text>
                  </View>
                )}
              </View>

              <View style={styles.resultActions}>
                <Button
                  title="Use This Vehicle"
                  onPress={handleConfirm}
                  style={styles.confirmButton}
                />
                <Button
                  title="Try Different VIN"
                  variant="outline"
                  onPress={() => {
                    setDecodedData(null);
                    setVinInput('');
                  }}
                  style={styles.retryButton}
                />
              </View>
            </View>
          </View>
        )}

        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Where to find your VIN:</Text>
          
          {selectedVehicleType === 'car' && (
            <>
              <View style={styles.helpItem}>
                <Icons.Eye size={16} color={Colors.textSecondary} />
                <Text style={styles.helpText}>Dashboard (visible through windshield)</Text>
              </View>
              <View style={styles.helpItem}>
                <Icons.DoorOpen size={16} color={Colors.textSecondary} />
                <Text style={styles.helpText}>Driver's side door frame</Text>
              </View>
            </>
          )}
          
          {selectedVehicleType === 'motorcycle' && (
            <>
              <View style={styles.helpItem}>
                <Icons.Bike size={16} color={Colors.textSecondary} />
                <Text style={styles.helpText}>Steering neck or frame (near handlebars)</Text>
              </View>
              <View style={styles.helpItem}>
                <Icons.Wrench size={16} color={Colors.textSecondary} />
                <Text style={styles.helpText}>Engine case or frame downtube</Text>
              </View>
            </>
          )}
          
          {selectedVehicleType === 'scooter' && (
            <>
              <View style={styles.helpItem}>
                <Icons.Zap size={16} color={Colors.textSecondary} />
                <Text style={styles.helpText}>Under the seat or on the frame</Text>
              </View>
              <View style={styles.helpItem}>
                <Icons.Settings size={16} color={Colors.textSecondary} />
                <Text style={styles.helpText}>Near the engine or on the footboard</Text>
              </View>
            </>
          )}
          
          <View style={styles.helpItem}>
            <Icons.FileText size={16} color={Colors.textSecondary} />
            <Text style={styles.helpText}>Vehicle registration or insurance documents</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  vehicleTypeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  vehicleTypeOption: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  selectedVehicleTypeOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  vehicleTypeText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedVehicleTypeText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  vinInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    fontFamily: 'monospace',
    letterSpacing: 1,
    marginBottom: 16,
  },
  vinActions: {
    flexDirection: 'row',
    gap: 12,
  },
  decodeButton: {
    flex: 2,
  },
  manualButton: {
    flex: 1,
  },
  loadingSection: {
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  resultsSection: {
    marginBottom: 24,
  },
  resultCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultHeader: {
    marginBottom: 16,
  },
  vehicleTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  vehicleTypeBadge: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  resultDetails: {
    marginBottom: 20,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  resultActions: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 2,
  },
  retryButton: {
    flex: 1,
  },
  helpSection: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});