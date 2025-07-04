import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import * as Icons from 'lucide-react-native';

interface PaymentMethodSelectorProps {
  onSelect: (method: string) => void;
  selectedMethod?: string;
}

const paymentMethods = [
  { id: 'cash', label: 'Cash / Paid Offline', icon: 'DollarSign' },
  { id: 'paypal', label: 'PayPal', icon: 'CreditCard' },
  { id: 'chime', label: 'Chime', icon: 'Smartphone' },
  { id: 'cashapp', label: 'Cash App', icon: 'Smartphone' },
  { id: 'stripe', label: 'Stripe (Coming Soon)', icon: 'CreditCard', disabled: true },
];

export default function PaymentMethodSelector({ onSelect, selectedMethod }: PaymentMethodSelectorProps) {
  const [selected, setSelected] = useState(selectedMethod || 'cash');

  const handleSelect = (methodId: string) => {
    if (paymentMethods.find(m => m.id === methodId)?.disabled) return;
    
    setSelected(methodId);
    onSelect(methodId);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Method</Text>
      
      <View style={styles.methodList}>
        {paymentMethods.map((method) => {
          const IconComponent = Icons[method.icon as keyof typeof Icons] as any;
          const isSelected = selected === method.id;
          const isDisabled = method.disabled;
          
          return (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodOption,
                isSelected && styles.methodOptionSelected,
                isDisabled && styles.methodOptionDisabled,
              ]}
              onPress={() => handleSelect(method.id)}
              disabled={isDisabled}
            >
              <IconComponent 
                size={20} 
                color={
                  isDisabled 
                    ? Colors.textMuted 
                    : isSelected 
                      ? Colors.white 
                      : Colors.textSecondary
                } 
              />
              <Text style={[
                styles.methodLabel,
                isSelected && styles.methodLabelSelected,
                isDisabled && styles.methodLabelDisabled,
              ]}>
                {method.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  methodList: {
    gap: 8,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
  },
  methodOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  methodOptionDisabled: {
    opacity: 0.5,
  },
  methodLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  methodLabelSelected: {
    color: Colors.white,
    fontWeight: '500',
  },
  methodLabelDisabled: {
    color: Colors.textMuted,
  },
});