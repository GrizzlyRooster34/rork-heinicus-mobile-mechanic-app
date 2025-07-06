import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Colors } from '@/constants/colors';
import * as Icons from 'lucide-react-native';
import { ServiceTool, ServiceType, VehicleType } from '@/types/service';
import { SERVICE_TOOLS } from '@/constants/services';

interface ToolsEquipmentSettingsProps {
  onSettingsChange: (settings: ToolsSettings) => void;
  vehicleType?: VehicleType;
}

interface ToolsSettings {
  availableTools: { [toolId: string]: boolean };
  customTools: ServiceTool[];
  toolConditions: { [toolId: string]: 'excellent' | 'good' | 'fair' | 'needs_replacement' };
  toolNotes: { [toolId: string]: string };
}

export function ToolsEquipmentSettings({ onSettingsChange, vehicleType = 'car' }: ToolsEquipmentSettingsProps) {
  const [settings, setSettings] = useState<ToolsSettings>({
    availableTools: {},
    customTools: [],
    toolConditions: {},
    toolNotes: {},
  });

  const [selectedCategory, setSelectedCategory] = useState<ServiceType>(
    vehicleType === 'motorcycle' ? 'motorcycle_oil_change' : 
    vehicleType === 'scooter' ? 'scooter_oil_change' : 'oil_change'
  );
  const [showAddTool, setShowAddTool] = useState(false);
  const [newTool, setNewTool] = useState<Partial<ServiceTool>>({
    name: '',
    category: 'basic',
    required: false,
    description: '',
  });

  const updateToolAvailability = (toolId: string, available: boolean) => {
    const newSettings = {
      ...settings,
      availableTools: {
        ...settings.availableTools,
        [toolId]: available,
      },
    };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const updateToolCondition = (toolId: string, condition: ToolsSettings['toolConditions'][string]) => {
    const newSettings = {
      ...settings,
      toolConditions: {
        ...settings.toolConditions,
        [toolId]: condition,
      },
    };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const updateToolNotes = (toolId: string, notes: string) => {
    const newSettings = {
      ...settings,
      toolNotes: {
        ...settings.toolNotes,
        [toolId]: notes,
      },
    };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const addCustomTool = () => {
    if (!newTool.name) {
      Alert.alert('Error', 'Please enter a tool name');
      return;
    }

    const tool: ServiceTool = {
      id: `custom-${Date.now()}`,
      name: newTool.name,
      category: newTool.category || 'basic',
      required: newTool.required || false,
      description: newTool.description || '',
    };

    const newSettings = {
      ...settings,
      customTools: [...settings.customTools, tool],
      availableTools: {
        ...settings.availableTools,
        [tool.id]: true,
      },
    };

    setSettings(newSettings);
    onSettingsChange(newSettings);
    setNewTool({ name: '', category: 'basic', required: false, description: '' });
    setShowAddTool(false);
  };

  const removeCustomTool = (toolId: string) => {
    Alert.alert(
      'Remove Tool',
      'Are you sure you want to remove this custom tool?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const newSettings = {
              ...settings,
              customTools: settings.customTools.filter(tool => tool.id !== toolId),
              availableTools: { ...settings.availableTools },
              toolConditions: { ...settings.toolConditions },
              toolNotes: { ...settings.toolNotes },
            };
            delete newSettings.availableTools[toolId];
            delete newSettings.toolConditions[toolId];
            delete newSettings.toolNotes[toolId];
            setSettings(newSettings);
            onSettingsChange(newSettings);
          },
        },
      ]
    );
  };

  const serviceCategories = [
    // Car Services
    { key: 'oil_change', title: 'Oil Change', icon: 'Droplets', vehicleType: 'car' },
    { key: 'brake_service', title: 'Brake Service', icon: 'Disc', vehicleType: 'car' },
    { key: 'tire_service', title: 'Tire Service', icon: 'Circle', vehicleType: 'car' },
    { key: 'battery_service', title: 'Battery Service', icon: 'Battery', vehicleType: 'car' },
    { key: 'engine_diagnostic', title: 'Engine Diagnostic', icon: 'Search', vehicleType: 'car' },
    { key: 'transmission', title: 'Transmission', icon: 'Settings', vehicleType: 'car' },
    { key: 'ac_service', title: 'A/C Service', icon: 'Snowflake', vehicleType: 'car' },
    { key: 'general_repair', title: 'General Repair', icon: 'Wrench', vehicleType: 'car' },
    { key: 'emergency_roadside', title: 'Emergency Roadside', icon: 'Phone', vehicleType: 'car' },
    
    // Motorcycle Services
    { key: 'motorcycle_oil_change', title: 'Motorcycle Oil Change', icon: 'Droplets', vehicleType: 'motorcycle' },
    { key: 'motorcycle_brake_inspection', title: 'Motorcycle Brake Inspection', icon: 'Disc', vehicleType: 'motorcycle' },
    { key: 'motorcycle_tire_replacement', title: 'Motorcycle Tire Replacement', icon: 'Circle', vehicleType: 'motorcycle' },
    { key: 'motorcycle_chain_service', title: 'Chain Service', icon: 'Settings', vehicleType: 'motorcycle' },
    { key: 'motorcycle_battery_service', title: 'Motorcycle Battery Service', icon: 'Battery', vehicleType: 'motorcycle' },
    { key: 'motorcycle_diagnostic', title: 'Motorcycle Diagnostic', icon: 'Search', vehicleType: 'motorcycle' },
    
    // Scooter Services
    { key: 'scooter_oil_change', title: 'Scooter Oil Change', icon: 'Droplets', vehicleType: 'scooter' },
    { key: 'scooter_brake_inspection', title: 'Scooter Brake Inspection', icon: 'Disc', vehicleType: 'scooter' },
    { key: 'scooter_tire_replacement', title: 'Scooter Tire Replacement', icon: 'Circle', vehicleType: 'scooter' },
    { key: 'scooter_carburetor_clean', title: 'Carburetor Cleaning', icon: 'Settings', vehicleType: 'scooter' },
    { key: 'scooter_battery_service', title: 'Scooter Battery Service', icon: 'Battery', vehicleType: 'scooter' },
    { key: 'scooter_diagnostic', title: 'Scooter Diagnostic', icon: 'Search', vehicleType: 'scooter' },
  ];

  const conditionColors = {
    excellent: Colors.success,
    good: Colors.primary,
    fair: Colors.warning,
    needs_replacement: Colors.error,
  };

  const conditionLabels = {
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    needs_replacement: 'Needs Replacement',
  };

  const currentTools = SERVICE_TOOLS[selectedCategory] || [];
  const availableCount = currentTools.filter(tool => settings.availableTools[tool.id]).length;
  const totalCount = currentTools.length;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Category Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {serviceCategories
            .filter(category => category.vehicleType === vehicleType)
            .map((category) => {
              const IconComponent = Icons[category.icon as keyof typeof Icons] as any;
              const isSelected = selectedCategory === category.key;
              
              return (
                <TouchableOpacity
                  key={category.key}
                  style={[styles.categoryButton, isSelected && styles.categoryButtonSelected]}
                  onPress={() => setSelectedCategory(category.key as ServiceType)}
                >
                  {IconComponent && (
                    <IconComponent 
                      size={20} 
                      color={isSelected ? Colors.primary : Colors.textMuted} 
                    />
                  )}
                  <Text style={[
                    styles.categoryButtonText,
                    isSelected && styles.categoryButtonTextSelected
                  ]}>
                    {category.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </ScrollView>
      </View>

      {/* Tools Overview */}
      <View style={styles.overviewCard}>
        <View style={styles.overviewHeader}>
          <Icons.Wrench size={20} color={Colors.primary} />
          <Text style={styles.overviewTitle}>
            {serviceCategories.find(c => c.key === selectedCategory)?.title} Tools
          </Text>
          <View style={[styles.vehicleTypeBadge, {
            backgroundColor: vehicleType === 'motorcycle' ? '#FF6B35' + '20' : 
                           vehicleType === 'scooter' ? '#9B59B6' + '20' : Colors.primary + '20',
            borderColor: vehicleType === 'motorcycle' ? '#FF6B35' : 
                        vehicleType === 'scooter' ? '#9B59B6' : Colors.primary
          }]}>
            <Text style={[styles.vehicleTypeText, {
              color: vehicleType === 'motorcycle' ? '#FF6B35' : 
                     vehicleType === 'scooter' ? '#9B59B6' : Colors.primary
            }]}>
              {vehicleType === 'motorcycle' ? '🏍️ MOTORCYCLE' : 
               vehicleType === 'scooter' ? '🛵 SCOOTER' : '🚗 CAR/TRUCK'}
            </Text>
          </View>
        </View>
        <Text style={styles.overviewText}>
          {availableCount} of {totalCount} tools available
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${totalCount > 0 ? (availableCount / totalCount) * 100 : 0}%` }
            ]} 
          />
        </View>
      </View>

      {/* Tools List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tools & Equipment</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddTool(true)}
          >
            <Icons.Plus size={16} color={Colors.primary} />
            <Text style={styles.addButtonText}>Add Tool</Text>
          </TouchableOpacity>
        </View>

        {currentTools.map((tool) => {
          const isAvailable = settings.availableTools[tool.id];
          const condition = settings.toolConditions[tool.id] || 'good';
          const notes = settings.toolNotes[tool.id] || '';

          return (
            <View key={tool.id} style={styles.toolCard}>
              <View style={styles.toolHeader}>
                <View style={styles.toolInfo}>
                  <View style={[
                    styles.toolIcon,
                    { backgroundColor: isAvailable ? Colors.success + '20' : Colors.textMuted + '20' }
                  ]}>
                    <Icons.Wrench 
                      size={16} 
                      color={isAvailable ? Colors.success : Colors.textMuted} 
                    />
                  </View>
                  <View style={styles.toolContent}>
                    <Text style={styles.toolName}>{tool.name}</Text>
                    <Text style={styles.toolDescription}>{tool.description}</Text>
                    {tool.required && (
                      <View style={styles.requiredBadge}>
                        <Text style={styles.requiredText}>Required</Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.availabilityButton,
                    isAvailable && styles.availabilityButtonActive
                  ]}
                  onPress={() => updateToolAvailability(tool.id, !isAvailable)}
                >
                  <Text style={[
                    styles.availabilityButtonText,
                    isAvailable && styles.availabilityButtonTextActive
                  ]}>
                    {isAvailable ? 'Available' : 'Not Available'}
                  </Text>
                </TouchableOpacity>
              </View>

              {isAvailable && (
                <View style={styles.toolDetails}>
                  <View style={styles.conditionRow}>
                    <Text style={styles.conditionLabel}>Condition:</Text>
                    <View style={styles.conditionButtons}>
                      {Object.entries(conditionLabels).map(([key, label]) => (
                        <TouchableOpacity
                          key={key}
                          style={[
                            styles.conditionButton,
                            condition === key && { 
                              backgroundColor: conditionColors[key as keyof typeof conditionColors] + '20',
                              borderColor: conditionColors[key as keyof typeof conditionColors]
                            }
                          ]}
                          onPress={() => updateToolCondition(tool.id, key as keyof typeof conditionLabels)}
                        >
                          <Text style={[
                            styles.conditionButtonText,
                            condition === key && { 
                              color: conditionColors[key as keyof typeof conditionColors] 
                            }
                          ]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.notesRow}>
                    <Text style={styles.notesLabel}>Notes:</Text>
                    <TextInput
                      style={styles.notesInput}
                      value={notes}
                      onChangeText={(text) => updateToolNotes(tool.id, text)}
                      placeholder="Add notes about this tool..."
                      multiline
                    />
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {/* Custom Tools */}
        {settings.customTools.length > 0 && (
          <View style={styles.customToolsSection}>
            <Text style={styles.customToolsTitle}>Custom Tools</Text>
            {settings.customTools.map((tool) => (
              <View key={tool.id} style={[styles.toolCard, styles.customToolCard]}>
                <View style={styles.toolHeader}>
                  <View style={styles.toolInfo}>
                    <View style={styles.toolIcon}>
                      <Icons.Plus size={16} color={Colors.primary} />
                    </View>
                    <View style={styles.toolContent}>
                      <Text style={styles.toolName}>{tool.name}</Text>
                      <Text style={styles.toolDescription}>{tool.description}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeCustomTool(tool.id)}
                  >
                    <Icons.Trash2 size={16} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Add Tool Modal */}
      {showAddTool && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Custom Tool</Text>
              <TouchableOpacity onPress={() => setShowAddTool(false)}>
                <Icons.X size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tool Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={newTool.name}
                  onChangeText={(text) => setNewTool({ ...newTool, name: text })}
                  placeholder="Enter tool name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={newTool.description}
                  onChangeText={(text) => setNewTool({ ...newTool, description: text })}
                  placeholder="Enter tool description"
                  multiline
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowAddTool(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.addToolButton}
                  onPress={addCustomTool}
                >
                  <Text style={styles.addToolButtonText}>Add Tool</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.primary + '20',
  },
  addButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  categoryScroll: {
    marginBottom: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryButtonSelected: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  categoryButtonTextSelected: {
    color: Colors.primary,
  },
  overviewCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  overviewText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.success,
  },
  toolCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customToolCard: {
    borderColor: Colors.primary + '30',
    backgroundColor: Colors.primary + '05',
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  toolInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toolIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toolContent: {
    flex: 1,
  },
  toolName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  toolDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  requiredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.error + '20',
    borderWidth: 1,
    borderColor: Colors.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredText: {
    fontSize: 10,
    color: Colors.error,
    fontWeight: '600',
  },
  availabilityButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.textMuted + '20',
    borderWidth: 1,
    borderColor: Colors.textMuted,
  },
  availabilityButtonActive: {
    backgroundColor: Colors.success + '20',
    borderColor: Colors.success,
  },
  availabilityButtonText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  availabilityButtonTextActive: {
    color: Colors.success,
  },
  toolDetails: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  conditionRow: {
    marginBottom: 12,
  },
  conditionLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: 8,
  },
  conditionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  conditionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  conditionButtonText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  notesRow: {
    marginTop: 8,
  },
  notesLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  customToolsSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  customToolsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  removeButton: {
    padding: 8,
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    margin: 20,
    maxWidth: 400,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.textMuted + '20',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  addToolButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  addToolButtonText: {
    fontSize: 16,
    color: Colors.white,
    fontWeight: '500',
  },
  vehicleTypeBadge: {
    backgroundColor: Colors.primary + '20',
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  vehicleTypeText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
  },
});