import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button } from '@/components/Button';
import { PaymentMethodSelector } from '@/components/PaymentMethodSelector';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/auth-store';
import * as Icons from 'lucide-react-native';

type PaymentMethod = 'cash' | 'paypal' | 'chime' | 'cashapp' | 'stripe';

interface JobPaymentLoggerProps {
  jobId: string;
  amount: number;
  onPaymentLogged?: (paymentData: PaymentLogData) => void;
}

interface PaymentLogData {
  jobId: string;
  method: PaymentMethod;
  amount: number;
  timestamp: Date;
  userId: string;
  notes?: string;
}

export default function JobPaymentLogger({ 
  jobId, 
  amount, 
  onPaymentLogged 
}: JobPaymentLoggerProps) {
  const { user } = useAuthStore();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [isLogging, setIsLogging] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  const logPayment = async (method: PaymentMethod) => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setIsLogging(true);

    try {
      const paymentData: PaymentLogData = {
        jobId,
        method,
        amount,
        timestamp: new Date(),
        userId: user.id,
        notes: `Payment received via ${method}`,
      };

      // Log to console for now - in production this would save to database
      console.log('Payment logged:', paymentData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setIsLogged(true);
      onPaymentLogged?.(paymentData);

      Alert.alert(
        'Payment Logged',
        `${method.charAt(0).toUpperCase() + method.slice(1)} payment of $${amount.toFixed(2)} has been recorded for job ${jobId}.`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Error logging payment:', error);
      Alert.alert('Error', 'Failed to log payment. Please try again.');
    } finally {
      setIsLogging(false);
    }
  };

  const handleLogPayment = () => {
    Alert.alert(
      'Confirm Payment',
      `Log ${selectedMethod} payment of $${amount.toFixed(2)} for job ${jobId}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Payment', 
          onPress: () => logPayment(selectedMethod) 
        },
      ]
    );
  };

  const resetLogger = () => {
    setIsLogged(false);
    setSelectedMethod('cash');
  };

  if (isLogged) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <Icons.CheckCircle size={48} color={Colors.success} />
          <Text style={styles.successTitle}>Payment Logged</Text>
          <Text style={styles.successMessage}>
            ${amount.toFixed(2)} payment via {selectedMethod} has been recorded.
          </Text>
          
          <Button
            title="Log Another Payment"
            variant="outline"
            onPress={resetLogger}
            style={styles.resetButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icons.DollarSign size={24} color={Colors.primary} />
        <Text style={styles.title}>Log Job Payment</Text>
      </View>

      <View style={styles.jobInfo}>
        <Text style={styles.jobId}>Job ID: {jobId}</Text>
        <Text style={styles.amount}>Amount: ${amount.toFixed(2)}</Text>
      </View>

      <PaymentMethodSelector
        selectedMethod={selectedMethod}
        onMethodChange={setSelectedMethod}
        amount={amount}
      />

      <View style={styles.actions}>
        <Button
          title={isLogging ? 'Logging Payment...' : 'Log Payment'}
          onPress={handleLogPayment}
          disabled={isLogging}
          style={styles.logButton}
        />
      </View>

      <View style={styles.note}>
        <Icons.Info size={16} color={Colors.textMuted} />
        <Text style={styles.noteText}>
          This will record that payment has been received for this job. 
          Make sure the payment method matches how the customer actually paid.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    margin: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  jobInfo: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  jobId: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
  },
  actions: {
    marginTop: 16,
  },
  logButton: {
    backgroundColor: Colors.success,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.success,
    marginTop: 16,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  resetButton: {
    borderColor: Colors.primary,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 16,
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
});