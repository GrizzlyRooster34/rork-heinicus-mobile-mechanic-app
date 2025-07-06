import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Alert, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { SERVICE_CATEGORIES, getToolsForService, getRequiredToolsForService, getServicesForVehicleType, getToolLoadoutSuggestions } from '@/constants/services';
import { SERVICE_PRICING } from '@/constants/pricing';
import { Button } from '@/components/Button';
import { PhotoUpload } from '@/components/PhotoUpload';
import { VinScanner } from '@/components/VinScanner';
import { AIAssistant } from '@/components/AIAssistant';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import { ServiceRequest, ServiceType, DiagnosticResult, Vehicle, VehicleType } from '@/types/service';
import { generateSmartQuote } from '@/utils/quote-generator';
import { ENV_CONFIG, logProductionEvent } from '@/utils/firebase-config';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import * as Icons from 'lucide-react-native';

export default function CustomerRequestScreen() {
  const params = useLocalSearchParams();
  const { addServiceRequest, addQuote, vehicles, currentLocation, setCurrentLocation, updateServiceRequest, addVehicle, logEvent } = useAppStore();
  const { user } = useAuthStore();
  
  const [selectedService, setSelectedService] = useState<ServiceType | null>(
    params.serviceType as ServiceType || null
  );
  const [description, setDescription] = useState(params.symptoms as string || '');
  const [photos, setPhotos] = useState<string[]>([]);
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | 'emergency'>(
    params.urgent === 'true' ? 'emergency' : 'medium'
  );
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [showVinScanner, setShowVinScanner] = useState(false);
  const [vinNumber, setVinNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiDiagnosis, setAiDiagnosis] = useState<DiagnosticResult | undefined>(
    params.aiDiagnosis ? JSON.parse(params.aiDiagnosis as string) : undefined
  );
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType>('car');

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    // Set selected vehicle from params or default to first vehicle
    if (params.vehicleId) {
      const vehicle = vehicles.find(v => v.id === params.vehicleId);
      if (vehicle) {
        setSelectedVehicle(vehicle);
        setSelectedVehicleType(vehicle.vehicleType);
      }
    } else if (vehicles.length > 0 && !selectedVehicle) {
      setSelectedVehicle(vehicles[0]);
      setSelectedVehicleType(vehicles[0].vehicleType);
    }
  }, [vehicles, params.vehicleId]);

  useEffect(() => {
    // Auto-generate quote if requested
    if (params.autoQuote === 'true' && selectedService && description && selectedVehicle) {
      // Small delay to ensure UI is ready
      setTimeout(() => {
        handleSubmit();
      }, 500);
    }
  }, [params.autoQuote, selectedService, description, selectedVehicle]);

  const getCurrentLocation = async () => {
    if (Platform.OS === 'web') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCurrentLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => console.log('Location error:', error)
        );
      }
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to provide service at your location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: address[0] ? `${address[0].street}, ${address[0].city}` : undefined,
      });
    } catch (error) {
      console.log('Location error:', error);
    }
  };

  const handleVinScanned = (vinData: any) => {
    setVinNumber(vinData.vin);
    setSelectedVehicleType(vinData.vehicleType);
    setShowVinScanner(false);
    
    // Production logging
    logProductionEvent('vin_scanned', {
      vin: vinData.vin,
      make: vinData.make,
      model: vinData.model,
      year: vinData.year,
      vehicleType: vinData.vehicleType
    });
    
    // Auto-create vehicle if it doesn't exist
    const existingVehicle = vehicles.find(v => v.vin === vinData.vin);
    if (!existingVehicle) {
      Alert.alert(
        'Vehicle Decoded',
        `${vinData.year} ${vinData.make} ${vinData.model} (${vinData.vehicleType})
VIN: ${vinData.vin}

Would you like to add this vehicle to your profile?`,
        [
          { text: 'Skip', style: 'cancel' },
          { 
            text: 'Add Vehicle', 
            onPress: () => {
              const newVehicle: Vehicle = {
                id: Date.now().toString(),
                make: vinData.make,
                model: vinData.model,
                year: vinData.year,
                vehicleType: vinData.vehicleType,
                vin: vinData.vin,
                trim: vinData.trim,
                engine: vinData.engine,
                mileage: 0, // User can update this later
              };
              addVehicle(newVehicle);
              setSelectedVehicle(newVehicle);
              setSelectedVehicleType(newVehicle.vehicleType);
              Alert.alert('Vehicle Added', 'Vehicle has been added to your profile.');
            }
          }
        ]
      );
    } else {
      setSelectedVehicle(existingVehicle);
      setSelectedVehicleType(existingVehicle.vehicleType);
      Alert.alert('Vehicle Found', 'This vehicle is already in your profile.');
    }
  };

  const handleAIDiagnosis = (diagnosis: DiagnosticResult) => {
    setAiDiagnosis(diagnosis);
    
    // Production logging
    logProductionEvent('ai_diagnosis_completed', {
      diagnosisId: diagnosis.id,
      confidence: diagnosis.confidence,
      urgencyLevel: diagnosis.urgencyLevel,
      vehicleMake: selectedVehicle?.make,
      vehicleModel: selectedVehicle?.model,
      vehicleType: selectedVehicleType
    });
    
    // Auto-fill description if empty
    if (!description.trim() && diagnosis.likelyCauses.length > 0) {
      setDescription(`AI Analysis suggests: ${diagnosis.likelyCauses[0]}. ${diagnosis.diagnosticSteps[0] || ''}`);
    }
    
    // Set urgency based on AI recommendation
    setUrgency(diagnosis.urgencyLevel);
    
    // Try to match AI services to our service types
    const matchedService = matchAIServiceToType(diagnosis.matchedServices, selectedVehicleType);
    if (matchedService && !selectedService) {
      setSelectedService(matchedService);
    }
  };

  const matchAIServiceToType = (aiServices: string[], vehicleType: VehicleType): ServiceType | null => {
    const serviceMap: Record<string, ServiceType[]> = {
      'oil': vehicleType === 'motorcycle' ? ['motorcycle_oil_change'] : 
             vehicleType === 'scooter' ? ['scooter_oil_change'] : ['oil_change'],
      'brake': vehicleType === 'motorcycle' ? ['motorcycle_brake_inspection'] : 
               vehicleType === 'scooter' ? ['scooter_brake_inspection'] : ['brake_service'],
      'tire': vehicleType === 'motorcycle' ? ['motorcycle_tire_replacement'] : 
              vehicleType === 'scooter' ? ['scooter_tire_replacement'] : ['tire_service'],
      'battery': vehicleType === 'motorcycle' ? ['motorcycle_battery_service'] : 
                 vehicleType === 'scooter' ? ['scooter_battery_service'] : ['battery_service'],
      'engine': vehicleType === 'motorcycle' ? ['motorcycle_diagnostic'] : 
                vehicleType === 'scooter' ? ['scooter_diagnostic'] : ['engine_diagnostic'],
      'transmission': ['transmission'],
      'air conditioning': ['ac_service'],
      'a/c': ['ac_service'],
      'diagnostic': vehicleType === 'motorcycle' ? ['motorcycle_diagnostic'] : 
                    vehicleType === 'scooter' ? ['scooter_diagnostic'] : ['engine_diagnostic'],
      'chain': ['motorcycle_chain_service'],
      'carburetor': ['scooter_carburetor_clean'],
    };

    for (const aiService of aiServices) {
      const lowerService = aiService.toLowerCase();
      for (const [keyword, serviceTypes] of Object.entries(serviceMap)) {
        if (lowerService.includes(keyword)) {
          return serviceTypes[0];
        }
      }
    }
    
    return 'general_repair';
  };

  const handleSubmit = async () => {
    if (!selectedService) {
      Alert.alert('Error', 'Please select a service type.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description of the issue.');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Please log in to submit a request.');
      return;
    }

    if (!selectedVehicle) {
      Alert.alert('Vehicle Required', 'Please select or add a vehicle first.', [
        { text: 'Add Vehicle', onPress: () => setShowVinScanner(true) },
        { text: 'Cancel', style: 'cancel' }
      ]);
      return;
    }

    setIsSubmitting(true);

    try {
      // Get required tools for this service
      const requiredTools = getRequiredToolsForService(selectedService).map(tool => tool.id);
      
      const request: ServiceRequest = {
        id: Date.now().toString(),
        type: selectedService,
        description: description.trim(),
        urgency,
        status: 'pending',
        createdAt: new Date(),
        photos: photos.length > 0 ? photos : undefined,
        location: currentLocation ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          address: currentLocation.address
        } : undefined,
        vehicleId: selectedVehicle.id,
        vehicleType: selectedVehicle.vehicleType,
        vinNumber: vinNumber || selectedVehicle.vin || undefined,
        aiDiagnosis: aiDiagnosis || undefined,
        requiredTools, // Set required tools for this service
        toolsChecked: {}, // Initialize empty tools check
      };

      addServiceRequest(request);

      // Production logging
      logProductionEvent('service_request_created', {
        requestId: request.id,
        serviceType: selectedService,
        urgency,
        hasAIDiagnosis: !!aiDiagnosis,
        vehicleId: selectedVehicle.id,
        vehicleType: selectedVehicle.vehicleType,
        toolsCount: requiredTools.length
      });

      // Generate smart quote automatically
      const quote = generateSmartQuote(request.id, {
        serviceType: selectedService,
        urgency,
        description: description.trim(),
        selectedParts: selectedParts.length > 0 ? selectedParts : undefined,
        aiDiagnosis,
        vehicle: selectedVehicle,
      });

      addQuote(quote);
      updateServiceRequest(request.id, { status: 'quoted' });

      // Production logging
      logProductionEvent('quote_generated', {
        quoteId: quote.id,
        requestId: request.id,
        totalCost: quote.totalCost,
        laborCost: quote.laborCost,
        partsCost: quote.partsCost,
        vehicleType: selectedVehicle.vehicleType
      });

      Alert.alert(
        'Request Submitted',
        'Your service request has been submitted and a quote has been generated automatically.',
        [
          { text: 'View Quote', onPress: () => router.push('/quotes') }
        ]
      );

      // Reset form
      setDescription('');
      setPhotos([]);
      setUrgency('medium');
      setSelectedService(null);
      setSelectedParts([]);
      setVinNumber('');
      setAiDiagnosis(undefined);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedServiceData = selectedService ? 
    SERVICE_CATEGORIES.find(s => s.id === selectedService) : null;

  const selectedServicePricing = selectedService ? 
    SERVICE_PRICING[selectedService] : null;

  const togglePart = (partName: string) => {
    setSelectedParts(prev => 
      prev.includes(partName) 
        ? prev.filter(p => p !== partName)
        : [...prev, partName]
    );
  };

  // Get services for selected vehicle type
  const availableServices = getServicesForVehicleType(selectedVehicleType);
  
  // Get tools for selected service
  const serviceTools = selectedService ? getToolsForService(selectedService) : [];
  const requiredServiceTools = selectedService ? getRequiredToolsForService(selectedService) : [];
  
  // Get tool loadout suggestions
  const toolLoadoutSuggestions = selectedService ? 
    getToolLoadoutSuggestions(selectedService, selectedVehicleType) : [];

  const getVehicleTypeIcon = (type: VehicleType) => {
    switch (type) {
      case 'motorcycle': return 'Bike';
      case 'scooter': return 'Zap';
      case 'car': return 'Car';
      default: return 'Car';
    }
  };

  const getVehicleTypeLabel = (type: VehicleType) => {
    switch (type) {
      case 'motorcycle': return 'Motorcycle';
      case 'scooter': return 'Scooter';
      case 'car': return 'Car/Truck';
      default: return 'Vehicle';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Production Environment Indicator */}
        {ENV_CONFIG?.isProduction && (
          <View style={styles.productionBanner}>
            <Icons.Shield size={16} color={Colors.success} />
            <Text style={styles.productionText}>Production Environment - Live Service</Text>
          </View>
        )}

        {/* Vehicle Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Vehicle</Text>
          <Text style={styles.sectionSubtitle}>
            We service cars, trucks, motorcycles, and scooters
          </Text>
          {vehicles.length > 0 ? (
            <View style={styles.vehicleSelector}>
              {vehicles.map((vehicle) => {
                const IconComponent = Icons[getVehicleTypeIcon(vehicle.vehicleType) as keyof typeof Icons] as any;
                
                return (
                  <View
                    key={vehicle.id}
                    style={[
                      styles.vehicleCard,
                      selectedVehicle?.id === vehicle.id && styles.selectedVehicleCard
                    ]}
                  >
                    <Button
                      title=""
                      variant={selectedVehicle?.id === vehicle.id ? 'primary' : 'outline'}
                      onPress={() => {
                        setSelectedVehicle(vehicle);
                        setSelectedVehicleType(vehicle.vehicleType);
                        setSelectedService(null); // Reset service when vehicle changes
                      }}
                      style={styles.vehicleButton}
                    >
                      <View style={styles.vehicleButtonContent}>
                        <View style={styles.vehicleTypeIndicator}>
                          <IconComponent size={16} color={selectedVehicle?.id === vehicle.id ? Colors.white : Colors.primary} />
                          <Text style={[
                            styles.vehicleTypeText,
                            selectedVehicle?.id === vehicle.id && styles.selectedVehicleTypeText
                          ]}>
                            {getVehicleTypeLabel(vehicle.vehicleType)}
                          </Text>
                        </View>
                        <Text style={[
                          styles.vehicleTitle,
                          selectedVehicle?.id === vehicle.id && styles.selectedVehicleTitle
                        ]}>
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </Text>
                        {vehicle.vin && (
                          <Text style={[
                            styles.vehicleVin,
                            selectedVehicle?.id === vehicle.id && styles.selectedVehicleVin
                          ]}>
                            VIN: {vehicle.vin.slice(-4)}
                          </Text>
                        )}
                      </View>
                    </Button>
                  </View>
                );
              })}
              <Button
                title="Add New Vehicle"
                variant="outline"
                onPress={() => setShowVinScanner(true)}
                style={styles.addVehicleButton}
              />
            </View>
          ) : (
            <View style={styles.noVehicleCard}>
              <Text style={styles.noVehicleText}>No vehicles found</Text>
              <Button
                title="Add Vehicle"
                variant="outline"
                onPress={() => setShowVinScanner(true)}
                style={styles.addVehicleButton}
              />
            </View>
          )}
        </View>

        {/* AI Assistant */}
        <View style={styles.section}>
          <View style={styles.aiHeader}>
            <Text style={styles.sectionTitle}>Get AI-Powered Diagnosis</Text>
            <Button
              title={showAIAssistant ? 'Hide AI Assistant' : 'Use AI Assistant'}
              variant="outline"
              size="small"
              onPress={() => setShowAIAssistant(!showAIAssistant)}
              style={styles.toggleButton}
            />
          </View>
          
          {showAIAssistant && (
            <AIAssistant
              vehicle={selectedVehicle || undefined}
              onDiagnosisComplete={handleAIDiagnosis}
              initialSymptoms={description}
            />
          )}

          {aiDiagnosis && !showAIAssistant && (
            <View style={styles.diagnosisPreview}>
              <View style={styles.diagnosisHeader}>
                <Icons.Brain size={16} color={Colors.primary} />
                <Text style={styles.diagnosisTitle}>AI Diagnosis Complete</Text>
                <Button
                  title="View Details"
                  variant="outline"
                  size="small"
                  onPress={() => setShowAIAssistant(true)}
                />
              </View>
              <Text style={styles.diagnosisPreviewText}>
                {aiDiagnosis.likelyCauses[0]} • {aiDiagnosis.urgencyLevel.toUpperCase()} priority
              </Text>
              {aiDiagnosis.estimatedCost && (
                <Text style={styles.diagnosisCostText}>
                  Estimated cost: ${aiDiagnosis.estimatedCost.min} - ${aiDiagnosis.estimatedCost.max}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Service Selection */}
        <View style={styles.section}>
          <View style={styles.serviceHeader}>
            <Text style={styles.sectionTitle}>
              Service Type for {getVehicleTypeLabel(selectedVehicleType)}
            </Text>
            <View style={styles.vehicleTypeBadge}>
              <Text style={styles.vehicleTypeBadgeText}>
                {selectedVehicleType === 'motorcycle' ? '🏍️' : 
                 selectedVehicleType === 'scooter' ? '🛵' : '🚗'} 
                {selectedVehicleType.toUpperCase()}
              </Text>
            </View>
          </View>
          {selectedServiceData ? (
            <View style={styles.selectedService}>
              <Text style={styles.selectedServiceTitle}>{selectedServiceData.title}</Text>
              <Text style={styles.selectedServiceDesc}>{selectedServiceData.description}</Text>
              {selectedServicePricing && (
                <Text style={styles.priceRange}>
                  Estimated: ${selectedServicePricing.priceRange.min} - ${selectedServicePricing.priceRange.max}
                </Text>
              )}
              <Button
                title="Change Service"
                variant="outline"
                size="small"
                onPress={() => setSelectedService(null)}
                style={styles.changeButton}
              />
            </View>
          ) : (
            <View style={styles.serviceGrid}>
              {availableServices.map((service) => (
                <Button
                  key={service.id}
                  title={service.title}
                  variant="outline"
                  onPress={() => setSelectedService(service.id)}
                  style={styles.serviceButton}
                />
              ))}
              {availableServices.length === 0 && (
                <Text style={styles.noServicesText}>
                  Please select a vehicle to see available services
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Tool Loadout Preview */}
        {selectedService && toolLoadoutSuggestions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended Tool Loadout</Text>
            <Text style={styles.sectionSubtitle}>
              Mechanic will verify these tools before starting work
            </Text>
            <View style={styles.toolsPreview}>
              <View style={styles.toolsStats}>
                <Text style={styles.toolsStatsText}>
                  {requiredServiceTools.length} required tools • {serviceTools.length - requiredServiceTools.length} optional
                </Text>
              </View>
              <View style={styles.toolsList}>
                {toolLoadoutSuggestions.slice(0, 6).map((toolName, index) => (
                  <View key={index} style={styles.toolItem}>
                    <Icons.CheckCircle size={14} color={Colors.success} />
                    <Text style={styles.toolName}>{toolName}</Text>
                  </View>
                ))}
                {toolLoadoutSuggestions.length > 6 && (
                  <Text style={styles.moreToolsText}>
                    +{toolLoadoutSuggestions.length - 6} more tools
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Parts Selection */}
        {selectedServicePricing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Common Parts (Optional)</Text>
            <Text style={styles.sectionSubtitle}>
              Select parts that may be needed for this service
            </Text>
            <View style={styles.partsGrid}>
              {selectedServicePricing.commonParts.map((part) => (
                <Button
                  key={part.name}
                  title={`${part.name} - $${part.price}`}
                  variant={selectedParts.includes(part.name) ? 'primary' : 'outline'}
                  size="small"
                  onPress={() => togglePart(part.name)}
                  style={styles.partButton}
                />
              ))}
            </View>
          </View>
        )}

        {/* VIN Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>
          <View style={styles.vinSection}>
            {vinNumber || selectedVehicle?.vin ? (
              <View style={styles.vinDisplay}>
                <Icons.CheckCircle size={20} color={Colors.success} />
                <Text style={styles.vinText}>
                  VIN: {vinNumber || selectedVehicle?.vin}
                </Text>
                <Button
                  title="Change"
                  variant="outline"
                  size="small"
                  onPress={() => setShowVinScanner(true)}
                />
              </View>
            ) : (
              <Button
                title="Scan/Enter VIN"
                variant="outline"
                onPress={() => setShowVinScanner(true)}
                style={styles.vinButton}
              />
            )}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Describe the Issue</Text>
          <TextInput
            style={styles.textArea}
            value={description}
            onChangeText={setDescription}
            placeholder="Please describe the problem, symptoms, or service needed..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Photo Upload */}
        <View style={styles.section}>
          <PhotoUpload
            photos={photos}
            onPhotosChange={setPhotos}
            maxPhotos={5}
          />
        </View>

        {/* Urgency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Urgency Level</Text>
          <View style={styles.urgencyGrid}>
            {[
              { key: 'low', label: 'Low', desc: 'Can wait a few days' },
              { key: 'medium', label: 'Medium', desc: 'Within 24-48 hours' },
              { key: 'high', label: 'High', desc: 'Same day service' },
              { key: 'emergency', label: 'Emergency', desc: 'Immediate assistance' },
            ].map((option) => (
              <Button
                key={option.key}
                title={`${option.label}
${option.desc}`}
                variant={urgency === option.key ? 'primary' : 'outline'}
                onPress={() => setUrgency(option.key as any)}
                style={styles.urgencyButton}
                textStyle={styles.urgencyButtonText}
              />
            ))}
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Location</Text>
          <View style={styles.locationCard}>
            {currentLocation ? (
              <>
                <Text style={styles.locationText}>
                  {currentLocation.address || 'Current Location'}
                </Text>
                <Text style={styles.locationCoords}>
                  {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                </Text>
              </>
            ) : (
              <Text style={styles.locationText}>Getting your location...</Text>
            )}
            <Button
              title="Update Location"
              variant="outline"
              size="small"
              onPress={getCurrentLocation}
              style={styles.locationButton}
            />
          </View>
        </View>

        {/* Submit */}
        <Button
          title={isSubmitting ? 'Submitting...' : 'Request Service & Get Quote'}
          onPress={handleSubmit}
          disabled={isSubmitting || !selectedService || !description.trim() || !selectedVehicle}
          style={styles.submitButton}
        />
      </View>

      {/* VIN Scanner Modal */}
      <Modal
        visible={showVinScanner}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <VinScanner
          onVinScanned={handleVinScanned}
          onClose={() => setShowVinScanner(false)}
        />
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
  },
  productionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.success + '10',
    borderWidth: 1,
    borderColor: Colors.success + '30',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  productionText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  vehicleSelector: {
    gap: 12,
  },
  vehicleCard: {
    borderRadius: 12,
  },
  selectedVehicleCard: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  vehicleButton: {
    padding: 0,
    minHeight: 'auto',
  },
  vehicleButtonContent: {
    padding: 16,
    alignItems: 'flex-start',
    width: '100%',
  },
  vehicleTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  vehicleTypeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  selectedVehicleTypeText: {
    color: Colors.white,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  selectedVehicleTitle: {
    color: Colors.white,
  },
  vehicleVin: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  selectedVehicleVin: {
    color: Colors.white,
    opacity: 0.8,
  },
  addVehicleButton: {
    alignSelf: 'flex-start',
  },
  noVehicleCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  noVehicleText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleButton: {
    alignSelf: 'flex-end',
  },
  diagnosisPreview: {
    backgroundColor: Colors.primary + '10',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    borderRadius: 12,
    padding: 12,
  },
  diagnosisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  diagnosisTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  diagnosisPreviewText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  diagnosisCostText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  selectedService: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  selectedServiceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  selectedServiceDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  priceRange: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 12,
  },
  changeButton: {
    alignSelf: 'flex-start',
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceButton: {
    minWidth: '48%',
    marginBottom: 8,
  },
  noServicesText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    padding: 20,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleTypeBadge: {
    backgroundColor: Colors.primary + '20',
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  vehicleTypeBadgeText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
  },
  toolsPreview: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
  },
  toolsStats: {
    marginBottom: 12,
  },
  toolsStatsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  toolsList: {
    gap: 8,
  },
  toolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolName: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  moreToolsText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  partsGrid: {
    gap: 8,
  },
  partButton: {
    alignSelf: 'flex-start',
  },
  vinSection: {
    marginBottom: 8,
  },
  vinDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  vinText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  vinButton: {
    alignSelf: 'flex-start',
  },
  textArea: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    color: Colors.text,
    fontSize: 16,
    minHeight: 100,
  },
  urgencyGrid: {
    gap: 8,
  },
  urgencyButton: {
    paddingVertical: 16,
  },
  urgencyButtonText: {
    textAlign: 'center',
    lineHeight: 20,
  },
  locationCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  locationText: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  locationButton: {
    alignSelf: 'flex-start',
  },
  submitButton: {
    marginTop: 12,
  },
});