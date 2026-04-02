import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Dimensions, PanResponder, Animated } from 'react-native';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { PRODUCTION_CONFIG, logProductionEvent } from '@/utils/firebase-config';
import * as Icons from 'lucide-react-native';
import { Platform } from 'react-native';
import { uploadSvgStringAsync } from '@/lib/storage';

interface SignatureCaptureProps {
  jobId: string;
  jobTitle: string;
  mechanicId: string;
  mechanicName?: string;
  onSignatureComplete: (jobId: string, signatureUrl: string) => void;
  onCancel: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export function SignatureCapture({
  jobId,
  jobTitle,
  mechanicId,
  mechanicName = 'Mechanic',
  onSignatureComplete,
  onCancel,
}: SignatureCaptureProps) {
  const [hasSignature, setHasSignature] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [signaturePaths, setSignaturePaths] = useState<{ x: number; y: number }[][]>([]);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const canvasRef = useRef<View>(null);

  // Create PanResponder for signature capture
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      setCurrentPath([{ x: locationX, y: locationY }]);
      
      // Production logging
      logProductionEvent('signature_started', {
        jobId,
        mechanicId,
        platform: Platform.OS
      });
    },
    
    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      setCurrentPath(prev => [...prev, { x: locationX, y: locationY }]);
    },
    
    onPanResponderRelease: () => {
      if (currentPath.length > 1) {
        setSignaturePaths(prev => [...prev, currentPath]);
        setCurrentPath([]);
        setHasSignature(true);
        setCustomerName('Customer'); // In production, this would come from job data
        
        // Production logging
        logProductionEvent('signature_drawn', {
          jobId,
          mechanicId,
          pathLength: currentPath.length
        });
      }
    },
  });

  const handleClearSignature = () => {
    setSignaturePaths([]);
    setCurrentPath([]);
    setHasSignature(false);
    setCustomerName('');
    
    logProductionEvent('signature_cleared', {
      jobId,
      mechanicId
    });
    
    Alert.alert('Signature Cleared', 'Please sign again.');
  };

  const handleMockSign = () => {
    // Production: Simulate signing with a simple path for demo/testing
    const mockPath = [
      { x: 50, y: 100 },
      { x: 100, y: 80 },
      { x: 150, y: 120 },
      { x: 200, y: 90 },
      { x: 250, y: 110 },
    ];
    
    setSignaturePaths([mockPath]);
    setHasSignature(true);
    setCustomerName('Customer');
    
    logProductionEvent('signature_simulated', {
      jobId,
      mechanicId,
      reason: 'demo_signature'
    });
    
    Alert.alert('Signature Captured', 'Customer signature has been recorded.');
  };

  const buildSignatureSvg = () => {
    const canvasWidth = Math.max(320, screenWidth - 40);
    const canvasHeight = 200;
    const pathElements = signaturePaths
      .filter((path) => path.length > 1)
      .map((path) => {
        const d = path
          .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
          .join(' ');
        return `<path d="${d}" fill="none" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />`;
      })
      .join('');

    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">`,
      `<rect width="100%" height="100%" fill="#ffffff" />`,
      pathElements,
      `</svg>`
    ].join('');
  };

  const handleComplete = () => {
    if (!hasSignature) {
      Alert.alert('Signature Required', 'Please capture customer signature before completing.');
      return;
    }

    // Production validation
    if (PRODUCTION_CONFIG.isProduction && !hasSignature) {
      Alert.alert(
        'Signature Required',
        'Customer signature is required to complete this job in production mode.',
        [{ text: 'OK' }]
      );
      return;
    }

    const handleConfirm = async () => {
      setIsUploading(true);
      try {
        const svg = buildSignatureSvg();
        const uploadPath = `signatures/${jobId}/${Date.now()}.svg`;
        const { url } = await uploadSvgStringAsync(svg, uploadPath);
        
        logProductionEvent('signature_completed', {
          jobId,
          mechanicId,
          customerName,
          signatureUrlLength: url.length
        });
        
        onSignatureComplete(jobId, url);
      } catch (error) {
        Alert.alert('Upload Failed', 'Unable to upload signature. Please try again.');
      } finally {
        setIsUploading(false);
      }
    };

    Alert.alert(
      'Complete Job',
      'Confirm job completion with customer signature?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => { void handleConfirm(); }
        }
      ]
    );
  };

  const renderSignaturePaths = () => {
    if (Platform.OS === 'web') {
      // For web, we'll show a simplified signature representation
      return hasSignature ? (
        <View style={styles.webSignature}>
          <Text style={styles.webSignatureText}>✓ Signature Captured</Text>
        </View>
      ) : null;
    }

    // For mobile, render the actual signature paths
    return (
      <View style={styles.signaturePaths}>
        {signaturePaths.map((path, pathIndex) => (
          <View key={pathIndex}>
            {path.map((point, pointIndex) => (
              <View
                key={pointIndex}
                style={[
                  styles.signaturePoint,
                  {
                    left: point.x - 2,
                    top: point.y - 2,
                  }
                ]}
              />
            ))}
          </View>
        ))}
        {currentPath.map((point, pointIndex) => (
          <View
            key={`current-${pointIndex}`}
            style={[
              styles.signaturePoint,
              styles.currentSignaturePoint,
              {
                left: point.x - 2,
                top: point.y - 2,
              }
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Customer Signature</Text>
        <Text style={styles.subtitle}>{jobTitle}</Text>
        {PRODUCTION_CONFIG.isProduction && (
          <View style={styles.requiredBadge}>
            <Text style={styles.requiredText}>REQUIRED</Text>
          </View>
        )}
      </View>

      {/* Job Summary */}
      <View style={styles.jobSummary}>
        <Text style={styles.summaryTitle}>Work Completed</Text>
        <Text style={styles.summaryText}>
          Service has been completed according to the agreed specifications. 
          Customer signature confirms satisfaction with the work performed.
        </Text>
        <Text style={styles.mechanicInfo}>Completed by: {mechanicName}</Text>
      </View>

      {/* Signature Canvas Area */}
      <View style={styles.signatureArea}>
        <Text style={styles.signatureLabel}>Customer Signature</Text>
        
        <View
          ref={canvasRef}
          style={[
            styles.signatureCanvas,
            hasSignature && styles.signatureCanvasWithSignature
          ]}
          {...(Platform.OS !== 'web' ? panResponder.panHandlers : {})}
        >
          {hasSignature ? (
            <View style={styles.signaturePreview}>
              <Icons.CheckCircle size={32} color={Colors.success} />
              <Text style={styles.signatureText}>Signature Captured</Text>
              <Text style={styles.customerNameText}>{customerName}</Text>
              {renderSignaturePaths()}
            </View>
          ) : (
            <View style={styles.signaturePlaceholder}>
              <Icons.Edit3 size={32} color={Colors.textMuted} />
              <Text style={styles.placeholderText}>
                {Platform.OS === 'web' 
                  ? 'Click "Simulate Signature" to capture signature'
                  : 'Draw customer signature here'
                }
              </Text>
              <Text style={styles.instructionText}>
                {Platform.OS === 'web'
                  ? 'Signature capture requires mobile device in production'
                  : 'Use finger or stylus to sign'
                }
              </Text>
            </View>
          )}
          
          {renderSignaturePaths()}
        </View>

        {/* Signature Controls */}
        <View style={styles.signatureControls}>
          {!hasSignature ? (
            <>
              <Button
                title="Simulate Signature"
                onPress={handleMockSign}
                style={styles.signButton}
              />
              {Platform.OS !== 'web' && (
                <Text style={styles.signatureHint}>
                  Or draw signature in the area above
                </Text>
              )}
            </>
          ) : (
            <Button
              title="Clear Signature"
              variant="outline"
              onPress={handleClearSignature}
              style={styles.clearButton}
            />
          )}
        </View>
      </View>

      {/* Agreement Text */}
      <View style={styles.agreementSection}>
        <Text style={styles.agreementText}>
          By signing above, the customer acknowledges that:
        </Text>
        <Text style={styles.agreementItem}>• Work has been completed satisfactorily</Text>
        <Text style={styles.agreementItem}>• All services have been explained</Text>
        <Text style={styles.agreementItem}>• Payment terms are understood</Text>
        <Text style={styles.agreementItem}>• Service performed by {mechanicName}</Text>
      </View>

      {/* Production Requirements */}
      {PRODUCTION_CONFIG.isProduction && (
        <View style={styles.requirementsCard}>
          <Icons.AlertCircle size={16} color={Colors.error} />
          <Text style={styles.requirementsText}>
            Customer signature is required for job completion in production mode.
            {hasSignature ? ' Signature captured successfully.' : ' Please capture signature to proceed.'}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          title="Cancel"
          variant="outline"
          onPress={onCancel}
          style={styles.cancelButton}
          disabled={isUploading}
        />
        <Button
          title={isUploading ? 'Uploading...' : 'Complete Job'}
          onPress={handleComplete}
          disabled={!hasSignature || isUploading}
          style={[
            styles.completeButton,
            ...(!hasSignature ? [styles.completeButtonDisabled] : [])
          ]}
        />
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <Icons.Shield size={16} color={Colors.textMuted} />
        <Text style={styles.footerText}>
          Digital signature is legally binding and securely stored
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.background,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  requiredBadge: {
    backgroundColor: Colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  requiredText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  jobSummary: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  mechanicInfo: {
    fontSize: 14,
    color: Colors.mechanic,
    fontWeight: '500',
  },
  signatureArea: {
    marginBottom: 24,
  },
  signatureLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  signatureCanvas: {
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  signatureCanvasWithSignature: {
    borderColor: Colors.success,
    borderStyle: 'solid',
    backgroundColor: Colors.success + '10',
  },
  signaturePreview: {
    alignItems: 'center',
    zIndex: 2,
  },
  signatureText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
    marginTop: 8,
  },
  customerNameText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  signaturePlaceholder: {
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.textMuted,
    marginTop: 12,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  signaturePaths: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  signaturePoint: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  currentSignaturePoint: {
    backgroundColor: Colors.secondary,
  },
  webSignature: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
  },
  webSignatureText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.success,
  },
  signatureControls: {
    alignItems: 'center',
  },
  signButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
  },
  clearButton: {
    paddingHorizontal: 32,
  },
  signatureHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  agreementSection: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  agreementText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  agreementItem: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    paddingLeft: 8,
  },
  requirementsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.error + '10',
    borderWidth: 1,
    borderColor: Colors.error + '30',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  requirementsText: {
    flex: 1,
    fontSize: 12,
    color: Colors.error,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  cancelButton: {
    flex: 1,
  },
  completeButton: {
    flex: 2,
    backgroundColor: Colors.success,
  },
  completeButtonDisabled: {
    backgroundColor: Colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
