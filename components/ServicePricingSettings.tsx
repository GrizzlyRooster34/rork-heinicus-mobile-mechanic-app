import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Colors } from '@/constants/colors';
import * as Icons from 'lucide-react-native';
import { ServiceType } from '@/types/service';
import { SERVICE_PRICING } from '@/constants/pricing';

interface ServicePricingSettingsProps {
  onSettingsChange: (settings: PricingSettings) => void;
}

interface PricingSettings {
  laborRate: number;
  emergencyRate: number;
  travelFee: number;
  minimumCharge: number;
  servicePricing: {
    [key in ServiceType]: {
      basePrice: number;
      laborRate: number;
      estimatedHours: number;
    };
  };
  discounts: {
    seniorDiscount: number;
    militaryDiscount: number;
    repeatCustomerDiscount: number;
  };
}

export function ServicePricingSettings({ onSettingsChange }: ServicePricingSettingsProps) {
  const [settings, setSettings] = useState<PricingSettings>({
    laborRate: 85,
    emergencyRate: 125,
    travelFee: 25,
    minimumCharge: 50,
    servicePricing: {
      oil_change: { basePrice: 45, laborRate: 75, estimatedHours: 0.5 },
      brake_service: { basePrice: 150, laborRate: 85, estimatedHours: 2 },
      tire_service: { basePrice: 80, laborRate: 75, estimatedHours: 1 },
      battery_service: { basePrice: 120, laborRate: 75, estimatedHours: 0.75 },
      engine_diagnostic: { basePrice: 100, laborRate: 85, estimatedHours: 1.5 },
      transmission: { basePrice: 200, laborRate: 95, estimatedHours: 3 },
      ac_service: { basePrice: 90, laborRate: 85, estimatedHours: 1.5 },
      general_repair: { basePrice: 75, laborRate: 85, estimatedHours: 2 },
      emergency_roadside: { basePrice: 65, laborRate: 95, estimatedHours: 1 },
    },
    discounts: {
      seniorDiscount: 10,
      militaryDiscount: 15,
      repeatCustomerDiscount: 5,
    },
  });

  const [editingService, setEditingService] = useState<ServiceType | null>(null);

  const updateGeneralSetting = (key: keyof Omit<PricingSettings, 'servicePricing' | 'discounts'>, value: number) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const updateServicePricing = (serviceType: ServiceType, field: keyof PricingSettings['servicePricing'][ServiceType], value: number) => {
    const newSettings = {
      ...settings,
      servicePricing: {
        ...settings.servicePricing,
        [serviceType]: {
          ...settings.servicePricing[serviceType],
          [field]: value,
        },
      },
    };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const updateDiscount = (discountType: keyof PricingSettings['discounts'], value: number) => {
    const newSettings = {
      ...settings,
      discounts: {
        ...settings.discounts,
        [discountType]: value,
      },
    };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const serviceTypes = [
    { key: 'oil_change', title: 'Oil Change', icon: 'Droplets' },
    { key: 'brake_service', title: 'Brake Service', icon: 'Disc' },
    { key: 'tire_service', title: 'Tire Service', icon: 'Circle' },
    { key: 'battery_service', title: 'Battery Service', icon: 'Battery' },
    { key: 'engine_diagnostic', title: 'Engine Diagnostic', icon: 'Search' },
    { key: 'transmission', title: 'Transmission', icon: 'Settings' },
    { key: 'ac_service', title: 'A/C Service', icon: 'Snowflake' },
    { key: 'general_repair', title: 'General Repair', icon: 'Wrench' },
    { key: 'emergency_roadside', title: 'Emergency Roadside', icon: 'Phone' },
  ];

  const resetToDefaults = () => {
    Alert.alert(
      'Reset to Defaults',
      'This will reset all pricing to default values. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            const defaultSettings: PricingSettings = {
              laborRate: 85,
              emergencyRate: 125,
              travelFee: 25,
              minimumCharge: 50,
              servicePricing: Object.fromEntries(
                Object.entries(SERVICE_PRICING).map(([key, value]) => [
                  key,
                  {
                    basePrice: value.basePrice,
                    laborRate: value.laborRate,
                    estimatedHours: value.estimatedHours,
                  },
                ])
              ) as PricingSettings['servicePricing'],
              discounts: {
                seniorDiscount: 10,
                militaryDiscount: 15,
                repeatCustomerDiscount: 5,
              },
            };
            setSettings(defaultSettings);
            onSettingsChange(defaultSettings);
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* General Rates */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>General Rates</Text>
          <TouchableOpacity onPress={resetToDefaults} style={styles.resetButton}>
            <Icons.RotateCcw size={16} color={Colors.primary} />
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rateCard}>
          <View style={styles.rateItem}>
            <Text style={styles.rateLabel}>Standard Labor Rate</Text>
            <View style={styles.rateInput}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                style={styles.rateValue}
                value={settings.laborRate.toString()}
                onChangeText={(text) => updateGeneralSetting('laborRate', parseFloat(text) || 0)}
                keyboardType="numeric"
                placeholder="85"
              />
              <Text style={styles.rateUnit}>/hr</Text>
            </View>
          </View>

          <View style={styles.rateItem}>
            <Text style={styles.rateLabel}>Emergency Rate</Text>
            <View style={styles.rateInput}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                style={styles.rateValue}
                value={settings.emergencyRate.toString()}
                onChangeText={(text) => updateGeneralSetting('emergencyRate', parseFloat(text) || 0)}
                keyboardType="numeric"
                placeholder="125"
              />
              <Text style={styles.rateUnit}>/hr</Text>
            </View>
          </View>

          <View style={styles.rateItem}>
            <Text style={styles.rateLabel}>Travel Fee</Text>
            <View style={styles.rateInput}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                style={styles.rateValue}
                value={settings.travelFee.toString()}
                onChangeText={(text) => updateGeneralSetting('travelFee', parseFloat(text) || 0)}
                keyboardType="numeric"
                placeholder="25"
              />
            </View>
          </View>

          <View style={styles.rateItem}>
            <Text style={styles.rateLabel}>Minimum Charge</Text>
            <View style={styles.rateInput}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                style={styles.rateValue}
                value={settings.minimumCharge.toString()}
                onChangeText={(text) => updateGeneralSetting('minimumCharge', parseFloat(text) || 0)}
                keyboardType="numeric"
                placeholder="50"
              />
            </View>
          </View>
        </View>
      </View>

      {/* Service-Specific Pricing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service-Specific Pricing</Text>
        {serviceTypes.map((service) => {
          const IconComponent = Icons[service.icon as keyof typeof Icons] as any;
          const pricing = settings.servicePricing[service.key as ServiceType];
          
          return (
            <View key={service.key} style={styles.serviceCard}>
              <TouchableOpacity
                style={styles.serviceHeader}
                onPress={() => setEditingService(editingService === service.key as ServiceType ? null : service.key as ServiceType)}
              >
                <View style={styles.serviceInfo}>
                  <View style={styles.serviceIcon}>
                    {IconComponent && <IconComponent size={20} color={Colors.primary} />}
                  </View>
                  <View style={styles.serviceContent}>
                    <Text style={styles.serviceTitle}>{service.title}</Text>
                    <Text style={styles.servicePrice}>
                      Base: ${pricing.basePrice} • Labor: ${pricing.laborRate}/hr • {pricing.estimatedHours}h
                    </Text>
                  </View>
                </View>
                <Icons.ChevronDown 
                  size={20} 
                  color={Colors.textMuted}
                  style={[
                    styles.chevron,
                    editingService === service.key && styles.chevronRotated
                  ]}
                />
              </TouchableOpacity>

              {editingService === service.key && (
                <View style={styles.serviceDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Base Price</Text>
                    <View style={styles.detailInput}>
                      <Text style={styles.dollarSign}>$</Text>
                      <TextInput
                        style={styles.detailValue}
                        value={pricing.basePrice.toString()}
                        onChangeText={(text) => updateServicePricing(service.key as ServiceType, 'basePrice', parseFloat(text) || 0)}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Labor Rate</Text>
                    <View style={styles.detailInput}>
                      <Text style={styles.dollarSign}>$</Text>
                      <TextInput
                        style={styles.detailValue}
                        value={pricing.laborRate.toString()}
                        onChangeText={(text) => updateServicePricing(service.key as ServiceType, 'laborRate', parseFloat(text) || 0)}
                        keyboardType="numeric"
                      />
                      <Text style={styles.rateUnit}>/hr</Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Estimated Hours</Text>
                    <View style={styles.detailInput}>
                      <TextInput
                        style={styles.detailValue}
                        value={pricing.estimatedHours.toString()}
                        onChangeText={(text) => updateServicePricing(service.key as ServiceType, 'estimatedHours', parseFloat(text) || 0)}
                        keyboardType="numeric"
                      />
                      <Text style={styles.rateUnit}>hrs</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Discounts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Discounts</Text>
        <View style={styles.discountCard}>
          <View style={styles.discountItem}>
            <Text style={styles.discountLabel}>Senior Discount</Text>
            <View style={styles.discountInput}>
              <TextInput
                style={styles.discountValue}
                value={settings.discounts.seniorDiscount.toString()}
                onChangeText={(text) => updateDiscount('seniorDiscount', parseFloat(text) || 0)}
                keyboardType="numeric"
                placeholder="10"
              />
              <Text style={styles.percentSign}>%</Text>
            </View>
          </View>

          <View style={styles.discountItem}>
            <Text style={styles.discountLabel}>Military Discount</Text>
            <View style={styles.discountInput}>
              <TextInput
                style={styles.discountValue}
                value={settings.discounts.militaryDiscount.toString()}
                onChangeText={(text) => updateDiscount('militaryDiscount', parseFloat(text) || 0)}
                keyboardType="numeric"
                placeholder="15"
              />
              <Text style={styles.percentSign}>%</Text>
            </View>
          </View>

          <View style={styles.discountItem}>
            <Text style={styles.discountLabel}>Repeat Customer</Text>
            <View style={styles.discountInput}>
              <TextInput
                style={styles.discountValue}
                value={settings.discounts.repeatCustomerDiscount.toString()}
                onChangeText={(text) => updateDiscount('repeatCustomerDiscount', parseFloat(text) || 0)}
                keyboardType="numeric"
                placeholder="5"
              />
              <Text style={styles.percentSign}>%</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.primary + '20',
  },
  resetText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  rateCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rateLabel: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  rateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dollarSign: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  rateValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
  rateUnit: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  serviceCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceContent: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  servicePrice: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
  serviceDetails: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  detailInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    minWidth: 30,
    textAlign: 'center',
  },
  discountCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  discountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  discountLabel: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  discountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  discountValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
  },
  percentSign: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
});