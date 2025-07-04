import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import * as Icons from 'lucide-react-native';

type ServiceType = 'auto' | 'motorcycle' | 'scooter';

interface ServiceTypeToggleProps {
  value: ServiceType;
  setValue: (value: ServiceType) => void;
}

const serviceTypes = [
  {
    id: 'auto' as ServiceType,
    label: 'Car/Truck',
    icon: 'Car',
    description: 'Cars, trucks, SUVs',
  },
  {
    id: 'motorcycle' as ServiceType,
    label: 'Motorcycle',
    icon: 'Bike',
    description: 'Motorcycles, dirt bikes',
  },
  {
    id: 'scooter' as ServiceType,
    label: 'Scooter',
    icon: 'Zap',
    description: 'Scooters, mopeds',
  },
];

export default function ServiceTypeToggle({ value, setValue }: ServiceTypeToggleProps) {
  const getIcon = (iconName: string) => {
    const IconComponent = Icons[iconName as keyof typeof Icons];
    if (IconComponent && typeof IconComponent === 'function') {
      return IconComponent as React.ComponentType<{ size: number; color: string }>;
    }
    return Icons.Car;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vehicle Type</Text>
      
      <View style={styles.toggleContainer}>
        {serviceTypes.map((type) => {
          const IconComponent = getIcon(type.icon);
          const isSelected = value === type.id;
          
          return (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.toggleOption,
                isSelected && styles.selectedOption,
              ]}
              onPress={() => setValue(type.id)}
            >
              <IconComponent 
                size={24} 
                color={isSelected ? Colors.primary : Colors.textMuted} 
              />
              <Text style={[
                styles.toggleLabel,
                isSelected && styles.selectedLabel,
              ]}>
                {type.label}
              </Text>
              <Text style={[
                styles.toggleDescription,
                isSelected && styles.selectedDescription,
              ]}>
                {type.description}
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
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    margin: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleOption: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  selectedOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  selectedLabel: {
    color: Colors.primary,
  },
  toggleDescription: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  selectedDescription: {
    color: Colors.primary,
    opacity: 0.8,
  },
});