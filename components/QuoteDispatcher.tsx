import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import ServiceTypeToggle from './ServiceTypeToggle';
import ScooterServiceSelector from './ScooterServiceSelector';
import VINCheckerMotorcycle from './VINCheckerMotorcycle';
import { VinScanner } from './VinScanner';
import { Colors } from '@/constants/colors';
import { VinData } from '@/types/service';
import * as Icons from 'lucide-react-native';

type ServiceType = 'auto' | 'motorcycle' | 'scooter';

interface QuoteDispatcherProps {
  onServiceSelected?: (service: any) => void;
  onVehicleDetected?: (vehicle: any) => void;
}

export default function QuoteDispatcher({ onServiceSelected, onVehicleDetected }: QuoteDispatcherProps) {
  const [serviceType, setServiceType] = useState<ServiceType>('auto');
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [vehicleInfo, setVehicleInfo] = useState<any>(null);
  const [showVinScanner, setShowVinScanner] = useState(false);

  const handleServiceSelect = (service: any) => {
    setSelectedServices(prev => [...prev, service]);
    onServiceSelected?.(service);
  };

  const handleVehicleDetected = (vehicle: any) => {
    setVehicleInfo(vehicle);
    onVehicleDetected?.(vehicle);
  };

  const handleVinScanned = (vinData: any) => {
    handleVehicleDetected(vinData);
    setShowVinScanner(false);
  };

  const renderServiceContent = () => {
    switch (serviceType) {
      case 'auto':
        return (
          <View style={styles.serviceContent}>
            <View style={styles.sectionHeader}>
              <Icons.Car size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Car Service</Text>
            </View>
            
            {showVinScanner ? (
              <VinScanner
                onVinScanned={(vinData: VinData) => handleVinScanned(vinData)}
                onClose={() => setShowVinScanner(false)}
              />
            ) : (
              <View style={styles.vinScannerButton}>
                <Text style={styles.serviceNote}>
                  Use the VIN scanner to identify your vehicle and get accurate service recommendations.
                </Text>
                <View style={styles.buttonContainer}>
                  <Icons.Camera size={20} color={Colors.primary} />
                  <Text 
                    style={styles.scanButtonText}
                    onPress={() => setShowVinScanner(true)}
                  >
                    Open VIN Scanner
                  </Text>
                </View>
              </View>
            )}
          </View>
        );

      case 'motorcycle':
        return (
          <View style={styles.serviceContent}>
            <View style={styles.sectionHeader}>
              <Icons.Bike size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Motorcycle Service</Text>
            </View>
            
            <VINCheckerMotorcycle
              onVehicleDetected={handleVehicleDetected}
            />
            
            <Text style={styles.serviceNote}>
              Enter your motorcycle's VIN to get specific service recommendations and pricing.
            </Text>
          </View>
        );

      case 'scooter':
        return (
          <View style={styles.serviceContent}>
            <View style={styles.sectionHeader}>
              <Icons.Bike size={20} color={Colors.secondary} />
              <Text style={styles.sectionTitle}>Scooter Service</Text>
            </View>
            
            <ScooterServiceSelector
              onSelect={handleServiceSelect}
              multiSelect={true}
            />
            
            <Text style={styles.serviceNote}>
              Select the services you need for your scooter. Multiple services can be combined.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Icons.Wrench size={24} color={Colors.primary} />
        <Text style={styles.title}>Service Quote</Text>
      </View>

      <ServiceTypeToggle
        value={serviceType}
        setValue={setServiceType}
      />

      {renderServiceContent()}

      {vehicleInfo && (
        <View style={styles.vehicleInfoContainer}>
          <View style={styles.vehicleInfoHeader}>
            <Icons.CheckCircle size={20} color={Colors.success} />
            <Text style={styles.vehicleInfoTitle}>Vehicle Detected</Text>
          </View>
          
          <View style={styles.vehicleInfoContent}>
            <Text style={styles.vehicleInfoText}>
              {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
            </Text>
            {vehicleInfo.engine && (
              <Text style={styles.vehicleInfoDetail}>
                Engine: {vehicleInfo.engine}
              </Text>
            )}
            {vehicleInfo.vin && (
              <Text style={styles.vehicleInfoDetail}>
                VIN: {vehicleInfo.vin}
              </Text>
            )}
          </View>
        </View>
      )}

      {selectedServices.length > 0 && (
        <View style={styles.selectedServicesContainer}>
          <View style={styles.selectedServicesHeader}>
            <Icons.List size={20} color={Colors.primary} />
            <Text style={styles.selectedServicesTitle}>
              Selected Services ({selectedServices.length})
            </Text>
          </View>
          
          <View style={styles.selectedServicesList}>
            {selectedServices.map((service, index) => (
              <View key={index} style={styles.selectedServiceItem}>
                <Text style={styles.selectedServiceName}>{service.name}</Text>
                {service.basePrice && (
                  <Text style={styles.selectedServicePrice}>
                    ${service.basePrice}
                  </Text>
                )}
              </View>
            ))}
          </View>
          
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Estimated Total:</Text>
            <Text style={styles.totalAmount}>
              ${selectedServices.reduce((total, service) => total + (service.basePrice || 0), 0)}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Icons.Info size={16} color={Colors.textMuted} />
        <Text style={styles.footerText}>
          Prices are estimates and may vary based on vehicle condition and parts availability. 
          Final pricing will be provided after inspection.
        </Text>
      </View>
    </ScrollView>
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
    padding: 20,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  serviceContent: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  serviceNote: {
    fontSize: 14,
    color: Colors.textSecondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    textAlign: 'center',
  },
  vinScannerButton: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    marginTop: 8,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  vehicleInfoContainer: {
    backgroundColor: Colors.successBackground,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  vehicleInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  vehicleInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
  },
  vehicleInfoContent: {
    gap: 4,
  },
  vehicleInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  vehicleInfoDetail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  selectedServicesContainer: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedServicesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  selectedServicesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  selectedServicesList: {
    gap: 8,
    marginBottom: 12,
  },
  selectedServiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  selectedServiceName: {
    fontSize: 14,
    color: Colors.text,
  },
  selectedServicePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 20,
    backgroundColor: Colors.card,
    margin: 16,
    borderRadius: 8,
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
});