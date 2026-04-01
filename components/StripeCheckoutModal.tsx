import React, { useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CardField, useConfirmPayment } from '@stripe/stripe-react-native';
import * as Icons from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/stores/auth-store';

interface StripeCheckoutModalProps {
  visible: boolean;
  jobId: string;
  quoteId: string;
  amount: number;
  description?: string;
  onCancel: () => void;
  onSuccess: (paymentIntentId: string) => Promise<void> | void;
}

export function StripeCheckoutModal({
  visible,
  jobId,
  quoteId,
  amount,
  description,
  onCancel,
  onSuccess,
}: StripeCheckoutModalProps) {
  const user = useAuthStore((state) => state.user);
  const { confirmPayment, loading } = useConfirmPayment();
  const createIntentMutation = trpc.payment.createPaymentIntent.useMutation();
  const syncPaymentStatusMutation = trpc.payment.syncPaymentStatus.useMutation();
  const [isCardComplete, setIsCardComplete] = useState(false);
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  const isProcessing =
    loading || createIntentMutation.isPending || syncPaymentStatusMutation.isPending;

  const billingDetails = useMemo(
    () => ({
      email: user?.email,
      name: user ? `${user.firstName} ${user.lastName}`.trim() : undefined,
    }),
    [user]
  );

  const handlePay = async () => {
    if (!publishableKey) {
      Alert.alert('Stripe Not Configured', 'Set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable payments.');
      return;
    }

    if (!isCardComplete) {
      Alert.alert('Card Required', 'Enter a valid card before submitting payment.');
      return;
    }

    try {
      const intent = await createIntentMutation.mutateAsync({
        jobId,
        quoteId,
        amount,
      });

      if (!intent.clientSecret) {
        throw new Error('Payment intent is missing a client secret.');
      }

      const confirmation = await confirmPayment(intent.clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails,
        },
      });

      if (confirmation.error) {
        throw new Error(confirmation.error.message);
      }

      const paymentIntentId = confirmation.paymentIntent?.id ?? intent.paymentIntentId;
      if (!paymentIntentId) {
        throw new Error('Payment intent ID was not returned by Stripe.');
      }

      await syncPaymentStatusMutation.mutateAsync({
        paymentIntentId,
      });

      await onSuccess(paymentIntentId);
    } catch (error) {
      Alert.alert(
        'Payment Failed',
        error instanceof Error ? error.message : 'Unable to complete payment.'
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Pay Quote</Text>
            <Text style={styles.subtitle}>Secure card payment via Stripe</Text>
          </View>
          <TouchableOpacity onPress={onCancel}>
            <Icons.X size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Amount due</Text>
            <Text style={styles.summaryAmount}>${amount.toFixed(2)}</Text>
            {description ? <Text style={styles.summaryDescription}>{description}</Text> : null}
          </View>

          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>Card Details</Text>
            <CardField
              postalCodeEnabled
              placeholders={{
                number: '4242 4242 4242 4242',
              }}
              cardStyle={{
                backgroundColor: Colors.surface,
                textColor: Colors.text,
                placeholderColor: Colors.textMuted,
                borderColor: Colors.border,
                borderWidth: 1,
                borderRadius: 12,
              }}
              style={styles.cardField}
              onCardChange={(card) => setIsCardComplete(Boolean(card.complete))}
            />
            <Text style={styles.cardHelpText}>
              Test card: 4242 4242 4242 4242, any future date, any CVC.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.payButton, (!isCardComplete || isProcessing) && styles.payButtonDisabled]}
            disabled={!isCardComplete || isProcessing}
            onPress={handlePay}
          >
            <Text style={styles.payButtonText}>
              {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
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
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryAmount: {
    marginTop: 6,
    fontSize: 30,
    fontWeight: '700',
    color: Colors.primary,
  },
  summaryDescription: {
    marginTop: 10,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  cardSection: {
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
  cardField: {
    width: '100%',
    height: 54,
    marginBottom: 10,
  },
  cardHelpText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  payButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
