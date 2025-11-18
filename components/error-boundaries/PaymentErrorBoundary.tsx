import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '@/constants/colors';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import * as Icons from 'lucide-react-native';

interface Props {
  children: ReactNode;
  onPaymentError?: (error: Error) => void;
  onRetryPayment?: () => void;
  onCancelPayment?: () => void;
}

export function PaymentErrorBoundary({ 
  children, 
  onPaymentError, 
  onRetryPayment, 
  onCancelPayment 
}: Props) {
  const handlePaymentError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Payment Error:', error, errorInfo);
    
    // Log payment-specific error details
    const paymentErrorDetails = {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context: 'payment_flow',
    };
    
    console.error('Payment Error Details:', paymentErrorDetails);
    
    if (onPaymentError) {
      onPaymentError(error);
    }
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Need help with your payment? Contact our support team.',
      [
        {
          text: 'Call Support',
          onPress: () => {
            // In a real app, would open phone dialer
            Alert.alert('Support', 'Call: (555) 123-4567');
          },
        },
        {
          text: 'Email Support',
          onPress: () => {
            // In a real app, would open email client
            Alert.alert('Support', 'Email: support@heinicus.com');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const fallback = (
    <View style={styles.container}>
      <Icons.CreditCard size={48} color={Colors.error} />
      <Text style={styles.title}>Payment Error</Text>
      <Text style={styles.message}>
        There was an issue processing your payment. Your card has not been charged.
      </Text>
      
      <View style={styles.securityNotice}>
        <Icons.Shield size={16} color={Colors.success} />
        <Text style={styles.securityText}>
          Your payment information is secure and encrypted
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        {onRetryPayment && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetryPayment}>
            <Icons.RefreshCw size={16} color={Colors.white} />
            <Text style={styles.retryButtonText}>Retry Payment</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.supportButton} onPress={handleContactSupport}>
          <Icons.HelpCircle size={16} color={Colors.primary} />
          <Text style={styles.supportButtonText}>Contact Support</Text>
        </TouchableOpacity>
      </View>
      
      {onCancelPayment && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancelPayment}>
          <Text style={styles.cancelButtonText}>Cancel Payment</Text>
        </TouchableOpacity>
      )}
      
      <Text style={styles.helpText}>
        No charges have been made to your payment method
      </Text>
    </View>
  );

  return (
    <ErrorBoundary 
      level="component" 
      fallback={fallback}
      onError={handlePaymentError}
    >
      {children}
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '10',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 24,
    gap: 8,
  },
  securityText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: Colors.primary,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  supportButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    marginBottom: 16,
  },
  cancelButtonText: {
    color: Colors.textMuted,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  helpText: {
    fontSize: 12,
    color: Colors.success,
    textAlign: 'center',
    fontWeight: '500',
  },
});