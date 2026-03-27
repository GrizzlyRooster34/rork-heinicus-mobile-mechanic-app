import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Image } from 'react-native';
import { Colors } from '@/constants/colors';
import * as Icons from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface MechanicVerificationPanelProps {
  onVerificationSubmitted?: () => void;
}

export function MechanicVerificationPanel({ onVerificationSubmitted }: MechanicVerificationPanelProps) {
  const [fullName, setFullName] = useState('');
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [idUri, setIdUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitVerificationMutation = trpc.mechanic.submitVerification.useMutation({
    onSuccess: () => {
      Alert.alert(
        'Verification Submitted',
        'Your verification documents have been submitted for review. You will be notified once the review is complete.',
        [{ text: 'OK', onPress: onVerificationSubmitted }]
      );
      // Reset form
      setFullName('');
      setSelfieUri(null);
      setIdUri(null);
    },
    onError: (error) => {
      console.log('Verification submission error:', error);
      Alert.alert(
        'Submission Failed', 
        error.message || 'Failed to submit verification. Please check your connection and try again.'
      );
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const pickImage = async (type: 'selfie' | 'id') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera roll permissions are required to upload photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'selfie' ? [1, 1] : [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        if (type === 'selfie') {
          setSelfieUri(uri);
        } else {
          setIdUri(uri);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async (type: 'selfie' | 'id') => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permissions are required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: type === 'selfie' ? [1, 1] : [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        if (type === 'selfie') {
          setSelfieUri(uri);
        } else {
          setIdUri(uri);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const showImageOptions = (type: 'selfie' | 'id') => {
    Alert.alert(
      `Add ${type === 'selfie' ? 'Selfie' : 'ID Photo'}`,
      'Choose how you would like to add your photo',
      [
        { text: 'Take Photo', onPress: () => takePhoto(type) },
        { text: 'Choose from Library', onPress: () => pickImage(type) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleSubmit = () => {
    if (!fullName.trim()) {
      Alert.alert('Missing Information', 'Please enter your full name.');
      return;
    }

    if (!selfieUri) {
      Alert.alert('Missing Photo', 'Please upload a selfie photo.');
      return;
    }

    if (!idUri) {
      Alert.alert('Missing Photo', 'Please upload a photo of your ID.');
      return;
    }

    setIsSubmitting(true);
    
    // For demo purposes, we'll use placeholder URLs since we can't upload actual files
    // In production, you would upload the images to a cloud storage service first
    const demoPhotoUri = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face';
    const demoIdUri = 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop';
    
    submitVerificationMutation.mutate({
      fullName: fullName.trim(),
      photoUri: demoPhotoUri,
      idUri: demoIdUri,
    });
  };

  if (isSubmitting) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text style={styles.loadingText}>Submitting verification...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icons.Shield size={24} color={Colors.mechanic} />
        <Text style={styles.title}>Identity Verification</Text>
      </View>

      <Text style={styles.description}>
        To ensure the safety and trust of our platform, we require all mechanics to verify their identity. 
        This process helps protect both mechanics and customers.
      </Text>

      {/* Full Name Input */}
      <View style={styles.inputSection}>
        <Text style={styles.label}>Full Legal Name</Text>
        <TextInput
          style={styles.textInput}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your full name as it appears on your ID"
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      {/* Selfie Upload */}
      <View style={styles.photoSection}>
        <Text style={styles.label}>Selfie Photo</Text>
        <Text style={styles.photoDescription}>
          Take a clear photo of yourself holding your ID next to your face
        </Text>
        
        <TouchableOpacity 
          style={styles.photoUpload}
          onPress={() => showImageOptions('selfie')}
        >
          {selfieUri ? (
            <View style={styles.photoPreview}>
              <Image source={{ uri: selfieUri }} style={styles.previewImage} />
              <View style={styles.photoOverlay}>
                <Icons.Edit2 size={20} color={Colors.white} />
              </View>
            </View>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Icons.Camera size={32} color={Colors.textMuted} />
              <Text style={styles.photoPlaceholderText}>Add Selfie</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ID Upload */}
      <View style={styles.photoSection}>
        <Text style={styles.label}>ID Photo</Text>
        <Text style={styles.photoDescription}>
          Take a clear photo of your government-issued ID (driver's license, passport, etc.)
        </Text>
        
        <TouchableOpacity 
          style={styles.photoUpload}
          onPress={() => showImageOptions('id')}
        >
          {idUri ? (
            <View style={styles.photoPreview}>
              <Image source={{ uri: idUri }} style={styles.previewImage} />
              <View style={styles.photoOverlay}>
                <Icons.Edit2 size={20} color={Colors.white} />
              </View>
            </View>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Icons.CreditCard size={32} color={Colors.textMuted} />
              <Text style={styles.photoPlaceholderText}>Add ID Photo</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Security Notice */}
      <View style={styles.securityNotice}>
        <Icons.Lock size={16} color={Colors.textMuted} />
        <Text style={styles.securityText}>
          Your personal information is encrypted and securely stored. We only use this information for verification purposes.
        </Text>
      </View>

      {/* Submit Button */}
      <Button
        title="Submit for Verification"
        onPress={handleSubmit}
        disabled={!fullName.trim() || !selfieUri || !idUri}
        style={styles.submitButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  photoSection: {
    marginBottom: 24,
  },
  photoDescription: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 12,
    lineHeight: 16,
  },
  photoUpload: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  photoOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.mechanic,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  submitButton: {
    marginTop: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});