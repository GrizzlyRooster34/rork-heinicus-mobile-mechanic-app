import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TextInput } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import * as Icons from 'lucide-react-native';

interface LicensePlateScannerProps {
  onPlateDetected: (plateNumber: string, state?: string) => void;
  onClose: () => void;
}

export function LicensePlateScanner({ onPlateDetected, onClose }: LicensePlateScannerProps) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [manualPlate, setManualPlate] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Icons.Camera size={48} color={Colors.textMuted} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionMessage}>
            We need camera access to scan license plates and help identify your vehicle.
          </Text>
          <Button
            title="Grant Camera Permission"
            onPress={requestPermission}
            style={styles.permissionButton}
          />
          <Button
            title="Enter Manually Instead"
            variant="outline"
            onPress={() => setShowManualEntry(true)}
            style={styles.manualButton}
          />
        </View>
      </View>
    );
  }

  const handleManualSubmit = () => {
    if (manualPlate.trim().length < 2) {
      Alert.alert('Invalid Plate', 'Please enter a valid license plate number.');
      return;
    }

    // Basic validation for license plate format
    const plateRegex = /^[A-Z0-9\-\s]{2,8}$/i;
    if (!plateRegex.test(manualPlate.trim())) {
      Alert.alert('Invalid Format', 'Please enter a valid license plate format (letters and numbers only).');
      return;
    }

    onPlateDetected(manualPlate.trim().toUpperCase());
  };

  const simulatePlateDetection = () => {
    setIsScanning(true);
    
    // Simulate OCR processing time
    setTimeout(() => {
      setIsScanning(false);
      
      // Mock detected plate for demo
      const mockPlates = ['ABC123', 'XYZ789', 'DEF456', 'GHI012'];
      const randomPlate = mockPlates[Math.floor(Math.random() * mockPlates.length)];
      
      Alert.alert(
        'License Plate Detected',
        `Detected: ${randomPlate}

Is this correct?`,
        [
          { text: 'No, Try Again', style: 'cancel' },
          { 
            text: 'Yes, Use This', 
            onPress: () => onPlateDetected(randomPlate, 'CA') // Mock state
          }
        ]
      );
    }, 2000);
  };

  if (showManualEntry) {
    return (
      <View style={styles.container}>
        <View style={styles.manualEntryContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Enter License Plate</Text>
            <Button
              title="×"
              onPress={onClose}
              style={styles.closeButton}
            />
          </View>

          <View style={styles.plateInputContainer}>
            <Icons.Car size={24} color={Colors.primary} />
            <TextInput
              style={styles.plateInput}
              value={manualPlate}
              onChangeText={setManualPlate}
              placeholder="Enter license plate number"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
              maxLength={8}
            />
          </View>

          <Text style={styles.inputHint}>
            Enter your license plate number (letters and numbers only)
          </Text>

          <View style={styles.manualActions}>
            <Button
              title="Use Camera Instead"
              variant="outline"
              onPress={() => setShowManualEntry(false)}
              style={styles.switchButton}
            />
            <Button
              title="Submit"
              onPress={handleManualSubmit}
              disabled={manualPlate.trim().length < 2}
              style={styles.submitButton}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing}>
        <View style={styles.overlay}>
          <View style={styles.header}>
            <Text style={styles.title}>Scan License Plate</Text>
            <Button
              title="×"
              onPress={onClose}
              style={styles.closeButton}
            />
          </View>

          <View style={styles.scanArea}>
            <View style={styles.plateFrame}>
              <View style={styles.frameCorner} />
              <View style={[styles.frameCorner, styles.topRight]} />
              <View style={[styles.frameCorner, styles.bottomLeft]} />
              <View style={[styles.frameCorner, styles.bottomRight]} />
              
              <Text style={styles.frameText}>
                {isScanning ? 'Scanning...' : 'Position license plate here'}
              </Text>
            </View>
          </View>

          <View style={styles.controls}>
            <Button
              title="Manual Entry"
              variant="outline"
              onPress={() => setShowManualEntry(true)}
              style={styles.manualEntryButton}
            />
            
            <Button
              title={isScanning ? 'Scanning...' : 'Scan Plate'}
              onPress={simulatePlateDetection}
              disabled={isScanning}
              style={styles.scanButton}
            />
            
            <Button
              title="Flip"
              variant="outline"
              onPress={() => setFacing((current: CameraType) => (current === 'back' ? 'front' : 'back'))}
              style={styles.flipButton}
            />
          </View>

          <View style={styles.instructions}>
            <Icons.Info size={16} color={Colors.white} />
            <Text style={styles.instructionsText}>
              Position the license plate within the frame. Make sure it's well-lit and clearly visible.
            </Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'space-between',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.white,
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 40,
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plateFrame: {
    width: 280,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  frameCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.white,
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    top: 'auto',
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  frameText: {
    color: Colors.white,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  manualEntryButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  scanButton: {
    flex: 2,
    backgroundColor: Colors.primary,
  },
  flipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 8,
  },
  instructionsText: {
    flex: 1,
    color: Colors.white,
    fontSize: 14,
    lineHeight: 18,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  permissionButton: {
    marginBottom: 12,
    minWidth: 200,
  },
  manualButton: {
    minWidth: 200,
  },
  manualEntryContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  plateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  plateInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: 2,
  },
  inputHint: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 24,
    textAlign: 'center',
  },
  manualActions: {
    flexDirection: 'row',
    gap: 12,
  },
  switchButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});