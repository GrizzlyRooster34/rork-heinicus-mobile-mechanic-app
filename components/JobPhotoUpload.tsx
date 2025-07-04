import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, ScrollView, Modal } from 'react-native';
import { Colors } from '@/constants/colors';
import * as ImagePicker from 'expo-image-picker';
import * as Icons from 'lucide-react-native';
import { Platform } from 'react-native';
import { JobPhoto } from '@/types/service';

interface JobPhotoUploadProps {
  jobId: string;
  photos: JobPhoto[];
  onPhotosChange: (photos: JobPhoto[]) => void;
  maxPhotos?: number;
  allowedTypes?: JobPhoto['type'][];
}

export function JobPhotoUpload({ 
  jobId, 
  photos, 
  onPhotosChange, 
  maxPhotos = 10,
  allowedTypes = ['before', 'during', 'after', 'parts', 'damage']
}: JobPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhotoType, setSelectedPhotoType] = useState<JobPhoto['type']>('after');
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<JobPhoto | null>(null);

  const requestPermissions = async () => {
    if (Platform.OS === 'web') {
      return true; // Web doesn't need permissions for file input
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload photos.');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    if (photos.length >= maxPhotos) {
      Alert.alert('Limit Reached', `You can only upload up to ${maxPhotos} photos.`);
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsUploading(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhoto: JobPhoto = {
          id: `photo-${Date.now()}`,
          url: result.assets[0].uri,
          type: selectedPhotoType,
          uploadedAt: new Date(),
          uploadedBy: 'mechanic-cody',
        };
        onPhotosChange([...photos, newPhoto]);
        setShowTypeSelector(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const takePhoto = async () => {
    if (photos.length >= maxPhotos) {
      Alert.alert('Limit Reached', `You can only upload up to ${maxPhotos} photos.`);
      return;
    }

    if (Platform.OS === 'web') {
      // Web fallback to image picker
      pickImage();
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera permissions to take photos.');
      return;
    }

    setIsUploading(true);

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhoto: JobPhoto = {
          id: `photo-${Date.now()}`,
          url: result.assets[0].uri,
          type: selectedPhotoType,
          uploadedAt: new Date(),
          uploadedBy: 'mechanic-cody',
        };
        onPhotosChange([...photos, newPhoto]);
        setShowTypeSelector(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (photoId: string) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const newPhotos = photos.filter(p => p.id !== photoId);
            onPhotosChange(newPhotos);
          }
        }
      ]
    );
  };

  const showPhotoOptions = () => {
    setShowTypeSelector(true);
  };

  const getTypeIcon = (type: JobPhoto['type']) => {
    switch (type) {
      case 'before': return 'Clock';
      case 'during': return 'Wrench';
      case 'after': return 'CheckCircle';
      case 'parts': return 'Package';
      case 'damage': return 'AlertTriangle';
      default: return 'Camera';
    }
  };

  const getTypeColor = (type: JobPhoto['type']) => {
    switch (type) {
      case 'before': return Colors.warning;
      case 'during': return Colors.mechanic;
      case 'after': return Colors.success;
      case 'parts': return Colors.secondary;
      case 'damage': return Colors.error;
      default: return Colors.primary;
    }
  };

  const getTypeLabel = (type: JobPhoto['type']) => {
    switch (type) {
      case 'before': return 'Before Work';
      case 'during': return 'Work in Progress';
      case 'after': return 'Completed Work';
      case 'parts': return 'Parts Used';
      case 'damage': return 'Damage Found';
      default: return type;
    }
  };

  const groupedPhotos = allowedTypes.reduce((acc, type) => {
    acc[type] = photos.filter(p => p.type === type);
    return acc;
  }, {} as Record<JobPhoto['type'], JobPhoto[]>);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Job Photos ({photos.length}/{maxPhotos})</Text>
        <Text style={styles.subtitle}>
          Document your work progress with photos
        </Text>
      </View>

      {/* Photo Groups */}
      <ScrollView style={styles.photosContainer} showsVerticalScrollIndicator={false}>
        {allowedTypes.map(type => {
          const typePhotos = groupedPhotos[type];
          const IconComponent = Icons[getTypeIcon(type) as keyof typeof Icons] as any;
          
          return (
            <View key={type} style={styles.photoGroup}>
              <View style={styles.groupHeader}>
                <View style={styles.groupTitleRow}>
                  <IconComponent size={16} color={getTypeColor(type)} />
                  <Text style={styles.groupTitle}>{getTypeLabel(type)}</Text>
                  <Text style={styles.groupCount}>({typePhotos.length})</Text>
                </View>
              </View>
              
              {typePhotos.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
                  {typePhotos.map((photo) => (
                    <View key={photo.id} style={styles.photoWrapper}>
                      <TouchableOpacity
                        style={styles.photoContainer}
                        onPress={() => setSelectedPhoto(photo)}
                      >
                        <Image source={{ uri: photo.url }} style={styles.photo} />
                        <View style={[styles.photoTypeBadge, { backgroundColor: getTypeColor(type) }]}>
                          <IconComponent size={12} color={Colors.white} />
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removePhoto(photo.id)}
                      >
                        <Icons.X size={16} color={Colors.white} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.emptyGroup}>
                  <Text style={styles.emptyText}>No {getTypeLabel(type).toLowerCase()} photos yet</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Add Photo Button */}
      <TouchableOpacity
        style={[styles.addButton, isUploading && styles.addButtonDisabled]}
        onPress={showPhotoOptions}
        disabled={isUploading || photos.length >= maxPhotos}
      >
        <Icons.Camera size={24} color={photos.length >= maxPhotos ? Colors.textMuted : Colors.primary} />
        <Text style={[
          styles.addButtonText,
          photos.length >= maxPhotos && styles.addButtonTextDisabled
        ]}>
          {isUploading ? 'Uploading...' : photos.length >= maxPhotos ? 'Photo limit reached' : 'Add Job Photo'}
        </Text>
      </TouchableOpacity>

      {/* Photo Type Selector Modal */}
      <Modal visible={showTypeSelector} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Photo Type</Text>
            <TouchableOpacity onPress={() => setShowTypeSelector(false)}>
              <Icons.X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {allowedTypes.map(type => {
              const IconComponent = Icons[getTypeIcon(type) as keyof typeof Icons] as any;
              
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeOption,
                    selectedPhotoType === type && styles.selectedTypeOption
                  ]}
                  onPress={() => setSelectedPhotoType(type)}
                >
                  <View style={styles.typeOptionLeft}>
                    <View style={[styles.typeIcon, { backgroundColor: getTypeColor(type) + '20' }]}>
                      <IconComponent size={20} color={getTypeColor(type)} />
                    </View>
                    <View>
                      <Text style={styles.typeOptionTitle}>{getTypeLabel(type)}</Text>
                      <Text style={styles.typeOptionCount}>
                        {groupedPhotos[type].length} photo{groupedPhotos[type].length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.radioButton,
                    selectedPhotoType === type && styles.selectedRadioButton
                  ]}>
                    {selectedPhotoType === type && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowTypeSelector(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCameraButton} onPress={takePhoto}>
              <Icons.Camera size={16} color={Colors.white} />
              <Text style={styles.modalCameraText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalGalleryButton} onPress={pickImage}>
              <Icons.Image size={16} color={Colors.primary} />
              <Text style={styles.modalGalleryText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <Modal visible={true} animationType="fade" presentationStyle="fullScreen">
          <View style={styles.viewerContainer}>
            <View style={styles.viewerHeader}>
              <TouchableOpacity onPress={() => setSelectedPhoto(null)}>
                <Icons.X size={24} color={Colors.white} />
              </TouchableOpacity>
              <Text style={styles.viewerTitle}>{getTypeLabel(selectedPhoto.type)}</Text>
              <TouchableOpacity onPress={() => removePhoto(selectedPhoto.id)}>
                <Icons.Trash2 size={24} color={Colors.error} />
              </TouchableOpacity>
            </View>
            <View style={styles.viewerContent}>
              <Image source={{ uri: selectedPhoto.url }} style={styles.viewerImage} />
            </View>
            <View style={styles.viewerFooter}>
              <Text style={styles.viewerDate}>
                {selectedPhoto.uploadedAt.toLocaleDateString()} at {selectedPhoto.uploadedAt.toLocaleTimeString()}
              </Text>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  photosContainer: {
    maxHeight: 400,
    marginBottom: 16,
  },
  photoGroup: {
    marginBottom: 20,
  },
  groupHeader: {
    marginBottom: 8,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  groupCount: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  photoRow: {
    flexDirection: 'row',
  },
  photoWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.card,
  },
  photoTypeBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    borderRadius: 8,
    padding: 2,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGroup: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  addButton: {
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  addButtonDisabled: {
    borderColor: Colors.textMuted,
    backgroundColor: Colors.surface,
  },
  addButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  addButtonTextDisabled: {
    color: Colors.textMuted,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.card,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedTypeOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  typeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeIcon: {
    padding: 8,
    borderRadius: 8,
  },
  typeOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  typeOptionCount: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioButton: {
    borderColor: Colors.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  modalCameraButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  modalCameraText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalGalleryButton: {
    flex: 1,
    backgroundColor: Colors.primary + '20',
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  modalGalleryText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  viewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  viewerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  viewerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  viewerFooter: {
    padding: 20,
    alignItems: 'center',
  },
  viewerDate: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.8,
  },
});