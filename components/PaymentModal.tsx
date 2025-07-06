import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { Quote } from '@/types/service';
import { useAppStore } from '@/stores/app-store';
import * as Icons from 'lucide-react-native';

interface PaymentModalProps {
  quote: Quote;
  paymentType?: 'deposit' | 'full' | 'completion';
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentModal({ quote, paymentType = 'full', onSuccess, onCancel }: PaymentModalProps) {
  const { updateQuote, updateServiceRequest, getJobParts } = useAppStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'apple_pay' | 'google_pay'>('card');

  const depositAmount = Math.round(quote.totalCost * 0.3); // 30% deposit
  const remainingAmount = quote.totalCost - depositAmount;
  
  // Calculate completion payment (includes parts if any)
  const jobParts = getJobParts(quote.serviceRequestId);
  const partsCost = jobParts.reduce((sum, part) => sum + (part.price * part.quantity), 0);
  const completionAmount = paymentType === 'completion' 
    ? quote.totalCost + partsCost 
    : paymentType === 'deposit' 
      ? depositAmount 
      : quote.totalCost;

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate Stripe payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, this would integrate with Stripe
      // const stripe = await getStripe();
      // const { error } = await stripe.redirectToCheckout({
      //   sessionId: quote.stripePaymentUrl
      // });
      
      // Simulate payment success (90% success rate for demo)
      const success = Math.random() > 0.1;
      
      if (success) {
        // Update quote status
        const now = new Date();
        
        if (paymentType === 'deposit') {
          updateQuote(quote.id, {
            status: 'deposit_paid',
            depositPaidAt: now,
            depositAmount: completionAmount,
            remainingBalance: remainingAmount,
          });
          
          // Update service request status
          updateServiceRequest(quote.serviceRequestId, {
            status: 'accepted'
          });
          
          Alert.alert(
            'Deposit Payment Successful',
            `Deposit of $${completionAmount} has been processed. Remaining balance: $${remainingAmount}`,
            [{ text: 'OK', onPress: onSuccess }]
          );
        } else if (paymentType === 'completion') {
          updateQuote(quote.id, {
            status: 'paid',
            paidAt: now,
            paymentMethod: selectedPaymentMethod,
            finalAmount: completionAmount,
            partsCost: partsCost,
          });
          
          // Update service request status
          updateServiceRequest(quote.serviceRequestId, {
            status: 'completed',
            paidAt: now
          });
          
          Alert.alert(
            'Payment Successful',
            `Final payment of $${completionAmount} has been processed successfully.${partsCost > 0 ? ` (Includes $${partsCost} in parts)` : ''}`,
            [{ text: 'OK', onPress: onSuccess }]
          );
        } else {
          updateQuote(quote.id, {
            status: 'paid',
            paidAt: now,
            paymentMethod: selectedPaymentMethod,
          });
          
          // Update service request status
          updateServiceRequest(quote.serviceRequestId, {
            status: 'completed',
            paidAt: now
          });
          
          Alert.alert(
            'Payment Successful',
            `Payment of $${completionAmount} has been processed successfully.`,
            [{ text: 'OK', onPress: onSuccess }]
          );
        }
      } else {
        throw new Error('Payment failed');
      }
    } catch (error) {
      Alert.alert(
        'Payment Failed', 
        'There was an issue processing your payment. Please try again or contact support.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplePay = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Not Available', 'Apple Pay is only available on iOS devices.');
      return;
    }
    
    setSelectedPaymentMethod('apple_pay');
    // In a real app, integrate with Apple Pay
    Alert.alert('Apple Pay', 'Apple Pay integration would be implemented here.');
  };

  const handleGooglePay = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Not Available', 'Google Pay is only available on Android devices.');
      return;
    }
    
    setSelectedPaymentMethod('google_pay');
    // In a real app, integrate with Google Pay
    Alert.alert('Google Pay', 'Google Pay integration would be implemented here.');
  };

  const getPaymentTitle = () => {
    switch (paymentType) {
      case 'deposit': return 'Pay Deposit';
      case 'completion': return 'Final Payment';
      default: return 'Payment';
    }
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{getPaymentTitle()}</Text>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Icons.X size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* Payment Type Info */}
          {paymentType === 'deposit' && (
            <View style={styles.depositInfo}>
              <Icons.Info size={20} color={Colors.primary} />
              <View style={styles.depositText}>
                <Text style={styles.depositTitle}>Deposit Payment</Text>
                <Text style={styles.depositDescription}>
                  Pay 30% now to secure your service. Remaining balance due upon completion.
                </Text>
              </View>
            </View>
          )}

          {paymentType === 'completion' && (
            <View style={styles.completionInfo}>
              <Icons.CheckCircle size={20} color={Colors.success} />
              <View style={styles.completionText}>
                <Text style={styles.completionTitle}>Job Completion Payment</Text>
                <Text style={styles.completionDescription}>
                  Final payment for completed work{partsCost > 0 ? ' including parts used' : ''}.
                </Text>
              </View>
            </View>
          )}

          {/* Quote Summary */}
          <View style={styles.quoteSection}>
            <Text style={styles.sectionTitle}>
              {paymentType === 'deposit' ? 'Deposit Summary' : 
               paymentType === 'completion' ? 'Final Payment Summary' : 'Quote Summary'}
            </Text>
            <View style={styles.quoteCard}>
              <Text style={styles.quoteDescription}>{quote.description}</Text>
              
              <View style={styles.breakdown}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Original Labor</Text>
                  <Text style={styles.breakdownValue}>${quote.laborCost}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Original Parts</Text>
                  <Text style={styles.breakdownValue}>${quote.partsCost}</Text>
                </View>
                
                {paymentType === 'completion' && partsCost > 0 && (
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Additional Parts Used</Text>
                    <Text style={styles.breakdownValue}>${partsCost}</Text>
                  </View>
                )}
                
                <View style={styles.breakdownDivider} />
                <View style={styles.breakdownRow}>
                  <Text style={styles.totalLabel}>
                    {paymentType === 'completion' ? 'Total with Parts' : 'Original Quote'}
                  </Text>
                  <Text style={styles.totalValue}>
                    ${paymentType === 'completion' ? quote.totalCost + partsCost : quote.totalCost}
                  </Text>
                </View>
                
                {paymentType === 'deposit' && (
                  <>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.depositLabel}>Deposit (30%)</Text>
                      <Text style={styles.depositValue}>${depositAmount}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.remainingLabel}>Remaining</Text>
                      <Text style={styles.remainingValue}>${remainingAmount}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Parts Breakdown for Completion Payment */}
          {paymentType === 'completion' && jobParts.length > 0 && (
            <View style={styles.partsSection}>
              <Text style={styles.sectionTitle}>Parts Used</Text>
              <View style={styles.partsCard}>
                {jobParts.map((part, index) => (
                  <View key={index} style={styles.partRow}>
                    <View style={styles.partInfo}>
                      <Text style={styles.partName}>{part.name}</Text>
                      <Text style={styles.partDescription}>{part.description}</Text>
                    </View>
                    <Text style={styles.partCost}>
                      ${part.price} x {part.quantity} = ${(part.price * part.quantity).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Payment Methods */}
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            
            {/* Credit Card */}
            <TouchableOpacity
              style={[
                styles.paymentMethod,
                selectedPaymentMethod === 'card' && styles.selectedPaymentMethod
              ]}
              onPress={() => setSelectedPaymentMethod('card')}
            >
              <Icons.CreditCard size={24} color={Colors.primary} />
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentMethodName}>Credit Card</Text>
                <Text style={styles.paymentDetails}>•••• •••• •••• 4242</Text>
              </View>
              <View style={styles.radioButton}>
                {selectedPaymentMethod === 'card' && (
                  <View style={styles.radioButtonSelected} />
                )}
              </View>
            </TouchableOpacity>

            {/* Apple Pay */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[
                  styles.paymentMethod,
                  selectedPaymentMethod === 'apple_pay' && styles.selectedPaymentMethod
                ]}
                onPress={handleApplePay}
              >
                <Icons.Smartphone size={24} color={Colors.primary} />
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentMethodName}>Apple Pay</Text>
                  <Text style={styles.paymentDetails}>Touch ID or Face ID</Text>
                </View>
                <View style={styles.radioButton}>
                  {selectedPaymentMethod === 'apple_pay' && (
                    <View style={styles.radioButtonSelected} />
                  )}
                </View>
              </TouchableOpacity>
            )}

            {/* Google Pay */}
            {Platform.OS === 'android' && (
              <TouchableOpacity
                style={[
                  styles.paymentMethod,
                  selectedPaymentMethod === 'google_pay' && styles.selectedPaymentMethod
                ]}
                onPress={handleGooglePay}
              >
                <Icons.Smartphone size={24} color={Colors.primary} />
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentMethodName}>Google Pay</Text>
                  <Text style={styles.paymentDetails}>Fingerprint or PIN</Text>
                </View>
                <View style={styles.radioButton}>
                  {selectedPaymentMethod === 'google_pay' && (
                    <View style={styles.radioButtonSelected} />
                  )}
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Icons.Shield size={16} color={Colors.success} />
            <Text style={styles.securityText}>
              Your payment is secured with 256-bit SSL encryption
            </Text>
          </View>
        </ScrollView>

        {/* Payment Actions */}
        <View style={styles.actions}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={onCancel}
            style={styles.cancelButton}
            disabled={isProcessing}
          />
          <Button
            title={isProcessing ? 'Processing...' : `Pay $${completionAmount}`}
            onPress={handlePayment}
            style={styles.payButton}
            disabled={isProcessing}
          />
        </View>
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  depositInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.primary + '10',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  depositText: {
    flex: 1,
  },
  depositTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  depositDescription: {
    fontSize: 14,
    color: Colors.primary,
    lineHeight: 20,
  },
  completionInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.success + '10',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  completionText: {
    flex: 1,
  },
  completionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
    marginBottom: 4,
  },
  completionDescription: {
    fontSize: 14,
    color: Colors.success,
    lineHeight: 20,
  },
  quoteSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  quoteCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quoteDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  breakdown: {
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  breakdownLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  breakdownValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    color: Colors.text,
    fontWeight: '700',
  },
  depositLabel: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  depositValue: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '700',
  },
  remainingLabel: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  remainingValue: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  partsSection: {
    marginBottom: 24,
  },
  partsCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  partRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  partInfo: {
    flex: 1,
    marginRight: 12,
  },
  partName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  partDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  partCost: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  paymentSection: {
    marginBottom: 24,
  },
  paymentMethod: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  selectedPaymentMethod: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  paymentDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
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
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.success + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  securityText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelButton: {
    flex: 1,
  },
  payButton: {
    flex: 2,
  },
});