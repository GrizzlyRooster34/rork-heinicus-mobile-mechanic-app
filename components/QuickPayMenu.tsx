import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Colors } from '@/constants/colors';
import { copyToClipboard } from '@/utils/misc';

interface QuickPayMenuProps {
  total: number;
}

const methodLinks = {
  CashApp: 'https://cash.app/$heinicus',
  Chime: 'https://chime.com/pay/heinicus',
  PayPal: 'https://paypal.me/heinicus',
};

export default function QuickPayMenu({ total }: QuickPayMenuProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (method: keyof typeof methodLinks) => {
    const link = `${methodLinks[method]}?amount=${total}`;
    await copyToClipboard(link);
    setCopied(true);
    Alert.alert('Copied!', `${method} payment link copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Payment Links</Text>
      <Text style={styles.subtitle}>Total: ${total.toFixed(2)}</Text>
      
      <View style={styles.buttonContainer}>
        {Object.keys(methodLinks).map((method) => (
          <TouchableOpacity
            key={method}
            style={styles.paymentButton}
            onPress={() => handleCopy(method as keyof typeof methodLinks)}
          >
            <Text style={styles.paymentButtonText}>Copy {method} Link</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {copied && (
        <Text style={styles.copiedText}>Link copied to clipboard!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: Colors.card,
    borderRadius: 8,
    marginVertical: 8,
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
    marginBottom: 16,
  },
  buttonContainer: {
    gap: 8,
  },
  paymentButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  paymentButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  copiedText: {
    color: Colors.success,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});