import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '@/constants/colors';
import { ValidatedForm, FormSection } from './ValidatedForm';
import { ValidatedTextInput, VINInput } from './ValidatedTextInput';
import { validateField, sanitizeDescription, sanitizeVIN } from '@/utils/validation';
import { ServiceType, VehicleType } from '@/types/service';
import { SERVICE_CATEGORIES } from '@/constants/services';
import * as Icons from 'lucide-react-native';

export interface ServiceRequestFormData {
  description: string;
  vinNumber?: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  vehicleType: VehicleType;
  serviceType: ServiceType;
}

export interface ServiceRequestFormProps {
  initialData?: Partial<ServiceRequestFormData>;
  onSubmit: (data: ServiceRequestFormData) => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function ServiceRequestForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ServiceRequestFormProps) {
  const [urgency, setUrgency] = useState<ServiceRequestFormData['urgency']>(
    initialData?.urgency || 'medium'
  );
  const [vehicleType, setVehicleType] = useState<VehicleType>(
    initialData?.vehicleType || 'car'
  );
  const [serviceType, setServiceType] = useState<ServiceType>(
    initialData?.serviceType || 'general'
  );

  // Form validation configuration
  const formConfig = {
    description: {
      required: true,
      validateOnChange: true,
      validateOnBlur: true,
      minLength: 10,
      maxLength: 1000,
      customValidator: (value: string) => {
        const result = validateField(value, {
          required: true,
          minLength: 10,
          maxLength: 1000,
        });
        
        if (result.isValid) {
          // Additional validation for service descriptions
          if (value.trim().length < 10) {
            return {
              isValid: false,
              errors: ['Please provide a more detailed description (at least 10 characters)'],
            };
          }
          
          // Check for emergency keywords
          const emergencyKeywords = [
            'emergency', 'urgent', 'asap', 'immediate', 'stranded', 
            'stuck', 'broken down', 'won\'t start', 'accident'
          ];
          
          const hasEmergencyKeywords = emergencyKeywords.some(keyword => 
            value.toLowerCase().includes(keyword)
          );
          
          if (hasEmergencyKeywords && urgency !== 'emergency') {
            return {
              isValid: true,
              errors: [],
              warnings: ['This sounds urgent. Consider setting urgency to Emergency.'],
            };
          }
        }
        
        return result;
      },
    },
    vinNumber: {
      required: false,
      validateOnChange: true,
      validateOnBlur: true,
      customValidator: (value: string) => {
        if (!value || value.trim().length === 0) {
          return { isValid: true, errors: [] };
        }
        
        const trimmedVIN = value.trim().toUpperCase();
        
        if (trimmedVIN.length !== 17) {
          return {
            isValid: false,
            errors: ['VIN must be exactly 17 characters long'],
          };
        }
        
        if (!/^[A-HJ-NPR-Z0-9]+$/.test(trimmedVIN)) {
          return {
            isValid: false,
            errors: ['VIN can only contain letters and numbers (excluding I, O, Q)'],
          };
        }
        
        return { isValid: true, errors: [] };
      },
    },
  };

  const handleSubmit = async (values: Record<string, string>) => {
    const formData: ServiceRequestFormData = {
      description: values.description,
      vinNumber: values.vinNumber || undefined,
      urgency,
      vehicleType,
      serviceType,
    };

    await onSubmit(formData);
  };

  const getUrgencyColor = (level: ServiceRequestFormData['urgency']) => {
    switch (level) {
      case 'emergency': return Colors.error;
      case 'high': return Colors.warning;
      case 'medium': return Colors.primary;
      case 'low': return Colors.success;
      default: return Colors.textMuted;
    }
  };

  const getVehicleIcon = (type: VehicleType) => {
    switch (type) {
      case 'car': return 'Car';
      case 'truck': return 'Truck';
      case 'motorcycle': return 'Bike';
      case 'suv': return 'Car';
      case 'van': return 'Truck';
      default: return 'Car';
    }
  };

  return (
    <ValidatedForm
      config={formConfig}
      onSubmit={handleSubmit}
      submitButtonTitle={isSubmitting ? 'Submitting Request...' : 'Submit Service Request'}
      submitButtonLoadingTitle="Submitting Request..."
      showSubmitButton={true}
      scrollable={true}
      showFormErrors={true}
    >
      {(formApi) => (
        <>
          <FormSection 
            title="Service Details" 
            description="Tell us what's wrong with your vehicle"
          >
            {/* Service Type Selection */}
            <View style={styles.selectionGroup}>
              <Text style={styles.selectionLabel}>Service Type *</Text>
              <View style={styles.selectionGrid}>
                {SERVICE_CATEGORIES.slice(0, 6).map((category) => {
                  const IconComponent = (Icons as any)[category.icon];
                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.selectionOption,
                        serviceType === category.id && styles.selectionOptionActive
                      ]}
                      onPress={() => setServiceType(category.id as ServiceType)}
                    >
                      <IconComponent 
                        size={24} 
                        color={serviceType === category.id ? Colors.white : Colors.primary} 
                      />
                      <Text style={[
                        styles.selectionOptionText,
                        serviceType === category.id && styles.selectionOptionTextActive
                      ]}>
                        {category.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Description */}
            <ValidatedTextInput
              label="Problem Description"
              required
              placeholder="Describe the issue in detail. What symptoms are you experiencing? When did it start?"
              multiline
              numberOfLines={4}
              style={styles.descriptionInput}
              sanitize={sanitizeDescription}
              helpText="The more details you provide, the better we can help you"
              {...formApi.getFieldProps('description')}
            />
          </FormSection>

          <FormSection 
            title="Vehicle Information" 
            description="Help us prepare for your service"
          >
            {/* Vehicle Type */}
            <View style={styles.selectionGroup}>
              <Text style={styles.selectionLabel}>Vehicle Type *</Text>
              <View style={styles.vehicleTypeSelector}>
                {[
                  { type: 'car' as VehicleType, label: 'Car' },
                  { type: 'truck' as VehicleType, label: 'Truck' },
                  { type: 'suv' as VehicleType, label: 'SUV' },
                  { type: 'van' as VehicleType, label: 'Van' },
                  { type: 'motorcycle' as VehicleType, label: 'Motorcycle' },
                ].map((vehicle) => {
                  const IconComponent = (Icons as any)[getVehicleIcon(vehicle.type)];
                  return (
                    <TouchableOpacity
                      key={vehicle.type}
                      style={[
                        styles.vehicleOption,
                        vehicleType === vehicle.type && styles.vehicleOptionActive
                      ]}
                      onPress={() => setVehicleType(vehicle.type)}
                    >
                      <IconComponent 
                        size={20} 
                        color={vehicleType === vehicle.type ? Colors.white : Colors.textSecondary} 
                      />
                      <Text style={[
                        styles.vehicleOptionText,
                        vehicleType === vehicle.type && styles.vehicleOptionTextActive
                      ]}>
                        {vehicle.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* VIN Number */}
            <VINInput
              label="VIN Number (Optional)"
              placeholder="Enter 17-character VIN"
              sanitize={sanitizeVIN}
              helpText="VIN helps us identify your exact vehicle and prepare the right parts"
              {...formApi.getFieldProps('vinNumber')}
            />
          </FormSection>

          <FormSection 
            title="Urgency Level" 
            description="How soon do you need this service?"
          >
            <View style={styles.urgencySelector}>
              {[
                { level: 'low' as const, label: 'Low', description: 'Can wait a few days' },
                { level: 'medium' as const, label: 'Medium', description: 'Within 1-2 days' },
                { level: 'high' as const, label: 'High', description: 'Today if possible' },
                { level: 'emergency' as const, label: 'Emergency', description: 'Immediate assistance' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.level}
                  style={[
                    styles.urgencyOption,
                    urgency === option.level && styles.urgencyOptionActive,
                    { borderColor: getUrgencyColor(option.level) + '30' }
                  ]}
                  onPress={() => {
                    setUrgency(option.level);
                    if (option.level === 'emergency') {
                      Alert.alert(
                        'Emergency Service',
                        'For immediate roadside assistance, please call our emergency line after submitting this request.',
                        [{ text: 'OK' }]
                      );
                    }
                  }}
                >
                  <View style={styles.urgencyHeader}>
                    <View style={[
                      styles.urgencyIndicator,
                      { backgroundColor: getUrgencyColor(option.level) }
                    ]} />
                    <Text style={[
                      styles.urgencyLabel,
                      urgency === option.level && { color: getUrgencyColor(option.level) }
                    ]}>
                      {option.label}
                    </Text>
                    {urgency === option.level && (
                      <Icons.CheckCircle size={16} color={getUrgencyColor(option.level)} />
                    )}
                  </View>
                  <Text style={styles.urgencyDescription}>{option.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </FormSection>

          {onCancel && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </ValidatedForm>
  );
}

const styles = StyleSheet.create({
  selectionGroup: {
    marginBottom: 20,
  },
  selectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 12,
  },
  selectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    minWidth: '48%',
    flex: 1,
  },
  selectionOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  selectionOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  selectionOptionTextActive: {
    color: Colors.white,
  },
  descriptionInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  vehicleTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    padding: 10,
    minWidth: 80,
  },
  vehicleOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  vehicleOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  vehicleOptionTextActive: {
    color: Colors.white,
  },
  urgencySelector: {
    gap: 12,
  },
  urgencyOption: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  urgencyOptionActive: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
  },
  urgencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  urgencyIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  urgencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  urgencyDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 20,
  },
  actionButtons: {
    marginTop: 16,
    gap: 12,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
});