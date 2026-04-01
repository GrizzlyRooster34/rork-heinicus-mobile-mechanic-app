import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Icons from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface ReviewSubmissionModalProps {
  visible: boolean;
  serviceLabel: string;
  revieweeName: string;
  onCancel: () => void;
  onSubmit: (input: { rating: number; comment?: string }) => Promise<void>;
}

export function ReviewSubmissionModal({
  visible,
  serviceLabel,
  revieweeName,
  onCancel,
  onSubmit,
}: ReviewSubmissionModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        rating,
        comment: comment.trim() || undefined,
      });
      setComment('');
      setRating(5);
    } catch (error) {
      Alert.alert('Review Failed', 'Unable to submit your review right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Leave a Review</Text>
            <Text style={styles.subtitle}>{serviceLabel}</Text>
          </View>
          <TouchableOpacity onPress={onCancel}>
            <Icons.X size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>How did {revieweeName} do?</Text>
            <View style={styles.starsRow}>
              {Array.from({ length: 5 }, (_, index) => {
                const starValue = index + 1;
                const filled = starValue <= rating;

                return (
                  <TouchableOpacity key={starValue} onPress={() => setRating(starValue)} style={styles.starButton}>
                    <Icons.Star
                      size={28}
                      color={filled ? Colors.warning : Colors.textMuted}
                      fill={filled ? Colors.warning : 'transparent'}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.ratingLabel}>{rating} / 5 stars</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Comment</Text>
            <TextInput
              style={styles.commentInput}
              multiline
              numberOfLines={6}
              maxLength={500}
              placeholder="Share what went well or what needs work."
              placeholderTextColor={Colors.textMuted}
              value={comment}
              onChangeText={setComment}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    marginTop: 4,
    color: Colors.textSecondary,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    paddingVertical: 8,
  },
  ratingLabel: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  commentInput: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.text,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
