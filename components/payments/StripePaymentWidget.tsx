import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import { Ionicons } from '@expo/vector-icons';

interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}

interface Quote {
  id: string;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  estimatedDuration: number;
  validUntil: Date;
  notes?: string;
  parts: Array<{
    partName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    description?: string;
  }>;
}

interface StripePaymentWidgetProps {
  quote: Quote;
  jobId: string;
  visible: boolean;
  onClose: () => void;
  onPaymentSuccess: (paymentId: string) => void;
}

export function StripePaymentWidget({
  quote,
  jobId,
  visible,
  onClose,
  onPaymentSuccess
}: StripePaymentWidgetProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Get payment methods
  const { data: paymentMethodsData, isLoading: loadingPaymentMethods } = 
    trpc.payments.getPaymentMethods.useQuery();

  const createPaymentIntentMutation = trpc.payments.createPaymentIntent.useMutation();
  const confirmPaymentMutation = trpc.payments.confirmPaymentIntent.useMutation();

  useEffect(() => {
    if (paymentMethodsData?.paymentMethods.length > 0) {
      const defaultMethod = paymentMethodsData.paymentMethods.find(pm => pm.isDefault) 
        || paymentMethodsData.paymentMethods[0];
      setSelectedPaymentMethod(defaultMethod);
    }
  }, [paymentMethodsData]);

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    try {
      setProcessing(true);

      // Create payment intent
      const paymentIntentResult = await createPaymentIntentMutation.mutateAsync({
        quoteId: quote.id,
        paymentMethodId: selectedPaymentMethod.id
      });

      if (!paymentIntentResult.success) {
        throw new Error('Failed to create payment intent');
      }

      // In a real app, you would handle 3D Secure authentication here
      // For demo purposes, we'll assume the payment is successful

      // Confirm payment
      const confirmResult = await confirmPaymentMutation.mutateAsync({
        paymentIntentId: paymentIntentResult.paymentIntent.id,
        paymentMethodId: selectedPaymentMethod.id
      });

      if (confirmResult.success) {
        Alert.alert(
          'Payment Successful',
          'Your payment has been processed successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                onPaymentSuccess(paymentIntentResult.payment.id);
                onClose();
              }
            }
          ]
        );
      } else {
        throw new Error('Payment failed');
      }

    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert(
        'Payment Failed',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    } finally {
      setProcessing(false);
    }
  };

  const formatCardBrand = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa': return 'Visa';
      case 'mastercard': return 'Mastercard';
      case 'amex': return 'American Express';
      case 'discover': return 'Discover';
      default: return brand.charAt(0).toUpperCase() + brand.slice(1);
    }
  };

  const renderPaymentMethod = (method: PaymentMethod) => (
    <TouchableOpacity
      key={method.id}
      style={[
        styles.paymentMethodItem,
        selectedPaymentMethod?.id === method.id && styles.selectedPaymentMethod
      ]}
      onPress={() => setSelectedPaymentMethod(method)}
    >
      <View style={styles.paymentMethodIcon}>
        <Ionicons 
          name={method.type === 'card' ? 'card' : 'wallet'} 
          size={24} 
          color={Colors.primary} 
        />
      </View>
      
      <View style={styles.paymentMethodDetails}>
        {method.card && (
          <>
            <Text style={styles.paymentMethodTitle}>
              {formatCardBrand(method.card.brand)} •••• {method.card.last4}
            </Text>
            <Text style={styles.paymentMethodSubtitle}>
              Expires {method.card.expMonth.toString().padStart(2, '0')}/{method.card.expYear}
            </Text>
          </>
        )}
        {method.isDefault && (
          <Text style={styles.defaultBadge}>Default</Text>
        )}
      </View>

      <View style={styles.radioButton}>
        {selectedPaymentMethod?.id === method.id && (
          <View style={styles.radioButtonSelected} />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderQuoteBreakdown = () => (
    <View style={styles.quoteSection}>
      <Text style={styles.sectionTitle}>Quote Breakdown</Text>
      
      <View style={styles.quoteItem}>
        <Text style={styles.quoteItemLabel}>Labor</Text>
        <Text style={styles.quoteItemValue}>${quote.laborCost.toFixed(2)}</Text>
      </View>

      {quote.parts.map((part, index) => (
        <View key={index} style={styles.quoteItem}>
          <View style={styles.partDetails}>
            <Text style={styles.quoteItemLabel}>{part.partName}</Text>
            <Text style={styles.partQuantity}>Qty: {part.quantity}</Text>
          </View>
          <Text style={styles.quoteItemValue}>${part.totalPrice.toFixed(2)}</Text>
        </View>
      ))}

      <View style={styles.quoteDivider} />
      
      <View style={styles.quoteItem}>
        <Text style={styles.quoteTotalLabel}>Total</Text>
        <Text style={styles.quoteTotalValue}>${quote.totalCost.toFixed(2)}</Text>
      </View>

      <Text style={styles.quoteValidUntil}>
        Valid until: {new Date(quote.validUntil).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Quote Breakdown */}
          {renderQuoteBreakdown()}

          {/* Payment Methods */}
          <View style={styles.paymentMethodsSection}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            
            {loadingPaymentMethods ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading payment methods...</Text>
              </View>
            ) : paymentMethodsData?.paymentMethods.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="card-outline" size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyStateText}>No payment methods found</Text>
                <TouchableOpacity style={styles.addPaymentButton}>
                  <Text style={styles.addPaymentButtonText}>Add Payment Method</Text>
                </TouchableOpacity>
              </View>
            ) : (
              paymentMethodsData?.paymentMethods.map(renderPaymentMethod)
            )}
          </View>

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
            <Text style={styles.securityText}>
              Your payment information is secure and encrypted
            </Text>
          </View>
        </ScrollView>

        {/* Payment Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.payButton,
              (!selectedPaymentMethod || processing) && styles.payButtonDisabled
            ]}
            onPress={handlePayment}
            disabled={!selectedPaymentMethod || processing}
          >
            {processing ? (
              <ActivityIndicator size="small" color={Colors.background} />
            ) : (
              <Text style={styles.payButtonText}>
                Pay ${quote.totalCost.toFixed(2)}
              </Text>
            )}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  quoteSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  quoteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  quoteItemLabel: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  quoteItemValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  partDetails: {
    flex: 1,
  },
  partQuantity: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  quoteDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  quoteTotalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  quoteTotalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
  },
  quoteValidUntil: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  paymentMethodsSection: {
    marginBottom: 32,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPaymentMethod: {
    borderColor: Colors.primary,
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderRadius: 20,
    marginRight: 12,
  },
  paymentMethodDetails: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  paymentMethodSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  defaultBadge: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
    marginTop: 4,
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
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
    marginBottom: 20,
  },
  addPaymentButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  addPaymentButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '500',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    marginBottom: 24,
  },
  securityText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  payButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.5,
  },
  payButtonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default StripePaymentWidget;