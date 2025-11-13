import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { trpcClient } from '@/lib/trpc';

export function usePhotoUpload(jobId: string, uploaderId: string) {
  const [isUploading, setIsUploading] = useState(false);

  const pickAndUploadImage = async (type: 'BEFORE' | 'AFTER' | 'DIAGNOSTIC' | 'PARTS' | 'GENERAL' = 'GENERAL') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return { success: false, error: 'Permission denied' };

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled) return { success: false, error: 'Cancelled' };

    setIsUploading(true);
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      const uploadResult = await trpcClient.photos.uploadPhoto.mutate({
        jobId,
        uploaderId,
        base64Data: `data:image/jpeg;base64,${manipResult.base64}`,
        type,
      });

      setIsUploading(false);
      return uploadResult;
    } catch (error) {
      setIsUploading(false);
      return { success: false, error: 'Upload failed' };
    }
  };

  return { pickAndUploadImage, isUploading };
}
