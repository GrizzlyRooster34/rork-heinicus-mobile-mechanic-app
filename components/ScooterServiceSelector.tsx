import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button } from '@/components/Button';
import { Colors } from '@/constants/colors';
import * as Icons from 'lucide-react-native';

interface ScooterService {
  id: string;
  name: string;
  description: string;
  estimatedTime: string;
  basePrice: number;
  icon: keyof typeof Icons;
}

const scooterServices: ScooterService[] = [
  {
    id: 'oil-change',
    name: 'Oil Change',
    description: 'Engine oil and filter replacement',
    estimatedTime: '30 min',
    basePrice: 45,
    icon: 'Droplets',
  },
  {
    id: 'brake-service',
    name: 'Brake Service',
    description: 'Brake pad inspection and replacement',
    estimatedTime: '45 min',
    basePrice: 85,
    icon: 'Disc',
  },
  {
    id: 'tire-change',
    name: 'Tire Change',
    description: 'Front or rear tire replacement',
    estimatedTime: '60 min',
    basePrice: 120,
    icon: 'Circle',
  },
  {
    id: 'belt-adjustment',
    name: 'Belt Adjustment',
    description: 'CVT belt inspection and adjustment',
    estimatedTime: '45 min',
    basePrice: 75,
    icon: 'RotateCcw',
  },
  {
    id: 'battery-service',
    name: 'Battery Service',
    description: 'Battery testing and replacement',
    estimatedTime: '20 min',
    basePrice: 65,
    icon: 'Battery',
  },
  {
    id: 'spark-plug',
    name: 'Spark Plug',
    description: 'Spark plug inspection and replacement',
    estimatedTime: '25 min',
    basePrice: 35,
    icon: 'Zap',
  },
  {
    id: 'air-filter',
    name: 'Air Filter',
    description: 'Air filter cleaning or replacement',
    estimatedTime: '15 min',
    basePrice: 25,
    icon: 'Wind',
  },
  {
    id: 'carburetor-clean',
    name: 'Carburetor Cleaning',
    description: 'Carburetor cleaning and adjustment',
    estimatedTime: '90 min',
    basePrice: 150,
    icon: 'Settings',
  },
  {
    id: 'general-inspection',
    name: 'General Inspection',
    description: 'Complete scooter safety inspection',
    estimatedTime: '45 min',
    basePrice: 55,
    icon: 'Search',
  },
];

interface ScooterServiceSelectorProps {
  onSelect: (service: ScooterService) => void;
  selectedServices?: string[];
  multiSelect?: boolean;
}

export default function ScooterServiceSelector({ 
  onSelect, 
  selectedServices = [], 
  multiSelect = false 
}: ScooterServiceSelectorProps) {
  const [selected, setSelected] = useState<string[]>(selectedServices);

  const handleServiceSelect = (service: ScooterService) => {
    if (multiSelect) {
      const newSelected = selected.includes(service.id)
        ? selected.filter(id => id !== service.id)
        : [...selected, service.id];
      setSelected(newSelected);
    } else {
      setSelected([service.id]);
    }
    
    onSelect(service);
  };

  const getIcon = (iconName: keyof typeof Icons) => {
    const IconComponent = Icons[iconName] as React.ComponentType<{ size: number; color: string }>;
    if (IconComponent) {
      return <IconComponent size={24} color={Colors.primary} />;
    }
    return <Icons.Settings size={24} color={Colors.primary} />;
  };

  const isSelected = (serviceId: string) => selected.includes(serviceId);

  const totalEstimatedCost = selected.reduce((total, serviceId) => {
    const service = scooterServices.find(s => s.id === serviceId);
    return total + (service?.basePrice || 0);
  }, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icons.Bike size={24} color={Colors.primary} />
        <Text style={styles.title}>Scooter Services</Text>
      </View>

      <Text style={styles.subtitle}>
        {multiSelect ? 'Select one or more services:' : 'Select a service:'}
      </Text>

      <ScrollView style={styles.servicesContainer} showsVerticalScrollIndicator={false}>
        {scooterServices.map((service) => (
          <Button
            key={service.id}
            onPress={() => handleServiceSelect(service)}
            style={[
              styles.serviceButton,
              isSelected(service.id) && styles.serviceButtonSelected,
            ]}
            variant={isSelected(service.id) ? 'primary' : 'outline'}
          >
            <View style={styles.serviceContent}>
              <View style={styles.serviceHeader}>
                {getIcon(service.icon)}
                <View style={styles.serviceInfo}>
                  <Text style={[
                    styles.serviceName,
                    isSelected(service.id) && styles.serviceNameSelected,
                  ]}>
                    {service.name}
                  </Text>
                  <Text style={[
                    styles.serviceDescription,
                    isSelected(service.id) && styles.serviceDescriptionSelected,
                  ]}>
                    {service.description}
                  </Text>
                </View>
              </View>
              
              <View style={styles.serviceDetails}>
                <View style={styles.serviceDetail}>
                  <Icons.Clock size={16} color={isSelected(service.id) ? Colors.white : Colors.textMuted} />
                  <Text style={[
                    styles.serviceDetailText,
                    isSelected(service.id) && styles.serviceDetailTextSelected,
                  ]}>
                    {service.estimatedTime}
                  </Text>
                </View>
                
                <View style={styles.serviceDetail}>
                  <Icons.DollarSign size={16} color={isSelected(service.id) ? Colors.white : Colors.textMuted} />
                  <Text style={[
                    styles.servicePrice,
                    isSelected(service.id) && styles.servicePriceSelected,
                  ]}>
                    ${service.basePrice}
                  </Text>
                </View>
              </View>
            </View>
          </Button>
        ))}
      </ScrollView>

      {multiSelect && selected.length > 0 && (
        <View style={styles.summary}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Selected Services ({selected.length})</Text>
            <Text style={styles.summaryTotal}>
              Total: ${totalEstimatedCost}
            </Text>
          </View>
          
          <View style={styles.selectedServices}>
            {selected.map(serviceId => {
              const service = scooterServices.find(s => s.id === serviceId);
              return service ? (
                <Text key={serviceId} style={styles.selectedServiceName}>
                  • {service.name}
                </Text>
              ) : null;
            })}
          </View>
        </View>
      )}
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
    maxHeight: 600,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  servicesContainer: {
    flex: 1,
    marginBottom: 16,
  },
  serviceButton: {
    marginBottom: 12,
    padding: 0,
  },
  serviceButtonSelected: {
    backgroundColor: Colors.primary,
  },
  serviceContent: {
    padding: 16,
    width: '100%',
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  serviceNameSelected: {
    color: Colors.white,
  },
  serviceDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  serviceDescriptionSelected: {
    color: Colors.white,
    opacity: 0.9,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceDetailText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  serviceDetailTextSelected: {
    color: Colors.white,
    opacity: 0.9,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  servicePriceSelected: {
    color: Colors.white,
  },
  summary: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  selectedServices: {
    gap: 4,
  },
  selectedServiceName: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});