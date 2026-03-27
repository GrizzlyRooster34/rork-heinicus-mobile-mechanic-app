import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface ReviewSubmissionModalProps {
  visible: boolean;
  onClose: () => void;
  jobId: string;
  revieweeName: string;
  revieweeType: 'mechanic' | 'customer';
  onSubmitSuccess: () => void;
}

const RATING_CATEGORIES = [
  { key: 'punctualityRating', label: 'Punctuality', icon: 'time-outline' },
  { key: 'qualityRating', label: 'Quality', icon: 'star-outline' },
  { key: 'communicationRating', label: 'Communication', icon: 'chatbubble-outline' },
  { key: 'valueRating', label: 'Value', icon: 'cash-outline' },
];

export function ReviewSubmissionModal({
  visible,
  onClose,
  jobId,
  revieweeName,
  revieweeType,
  onSubmitSuccess
}: ReviewSubmissionModalProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [categoryRatings, setCategoryRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const submitReviewMutation = trpc.reviews.submitReview.useMutation();

  const resetForm = () => {
    setOverallRating(0);
    setCategoryRatings({});
    setComment('');
    setPhotos([]);
    setSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (overallRating === 0) {
      Alert.alert('Missing Rating', 'Please provide an overall rating');
      return;
    }

    try {
      setSubmitting(true);

      await submitReviewMutation.mutateAsync({
        jobId,
        rating: overallRating,
        comment: comment.trim() || undefined,
        photos,
        punctualityRating: categoryRatings.punctualityRating,
        qualityRating: categoryRatings.qualityRating,
        communicationRating: categoryRatings.communicationRating,
        valueRating: categoryRatings.valueRating,
      });

      Alert.alert(
        'Review Submitted',
        'Thank you for your feedback!',
        [
          {
            text: 'OK',
            onPress: () => {
              handleClose();
              onSubmitSuccess();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to submit review'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll permission is required to add photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => [...prev, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const renderStarRating = (
    rating: number,
    onRate: (rating: number) => void,
    size: number = 32
  ) => {
    return (
      <View style={styles.starRating}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onRate(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={size}
              color={star <= rating ? Colors.warning : Colors.border}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderCategoryRating = (category: typeof RATING_CATEGORIES[0]) => {
    const rating = categoryRatings[category.key] || 0;
    
    return (
      <View key={category.key} style={styles.categoryRating}>
        <View style={styles.categoryHeader}>
          <Ionicons name={category.icon as any} size={20} color={Colors.primary} />
          <Text style={styles.categoryLabel}>{category.label}</Text>
        </View>
        {renderStarRating(rating, (newRating) => {
          setCategoryRatings(prev => ({
            ...prev,
            [category.key]: newRating
          }));
        }, 24)}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Write Review</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Reviewee Info */}
          <View style={styles.revieweeInfo}>
            <Text style={styles.revieweeTitle}>
              Reviewing {revieweeType === 'mechanic' ? 'Mechanic' : 'Customer'}
            </Text>
            <Text style={styles.revieweeName}>{revieweeName}</Text>
          </View>

          {/* Overall Rating */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overall Rating *</Text>
            <Text style={styles.sectionSubtitle}>
              How would you rate your overall experience?
            </Text>
            {renderStarRating(overallRating, setOverallRating, 40)}
            {overallRating > 0 && (
              <Text style={styles.ratingText}>
                {overallRating === 1 && 'Poor'}
                {overallRating === 2 && 'Fair'}
                {overallRating === 3 && 'Good'}
                {overallRating === 4 && 'Very Good'}
                {overallRating === 5 && 'Excellent'}
              </Text>
            )}
          </View>

          {/* Category Ratings */}
          {revieweeType === 'mechanic' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detailed Ratings</Text>
              <Text style={styles.sectionSubtitle}>
                Rate specific aspects of the service
              </Text>
              {RATING_CATEGORIES.map(renderCategoryRating)}
            </View>
          )}

          {/* Written Review */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Written Review</Text>
            <Text style={styles.sectionSubtitle}>
              Share details about your experience (optional)
            </Text>
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder={`Tell others about your experience with ${revieweeName}...`}
              placeholderTextColor={Colors.textSecondary}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {comment.length}/500 characters
            </Text>
          </View>

          {/* Photos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Photos</Text>
            <Text style={styles.sectionSubtitle}>
              Show others what you experienced (optional)
            </Text>
            
            <View style={styles.photosContainer}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image source={{ uri: photo }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Ionicons name="close-circle" size={24} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
              
              {photos.length < 3 && (
                <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto}>
                  <Ionicons name="camera-outline" size={32} color={Colors.textSecondary} />
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Guidelines */}
          <View style={styles.guidelines}>
            <Text style={styles.guidelinesTitle}>Review Guidelines</Text>
            <Text style={styles.guidelinesText}>
              • Be honest and helpful{'\n'}
              • Focus on your experience{'\n'}
              • Be respectful and professional{'\n'}
              • Avoid personal information
            </Text>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (overallRating === 0 || submitting) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={overallRating === 0 || submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  revieweeInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  revieweeTitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  revieweeName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  starRating: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
    textAlign: 'center',
  },
  categoryRating: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginLeft: 8,
    flex: 1,
  },
  commentInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    minHeight: 120,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.background,
    borderRadius: 12,
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  guidelines: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  guidelinesText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.5,
  },
  submitButtonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ReviewSubmissionModal;