import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import * as Icons from 'lucide-react-native';

interface MaintenanceItem {
  id: string;
  service: string;
  dueDate: Date;
  dueMileage: number;
  priority: 'high' | 'medium' | 'low';
  description: string;
  estimatedCost: number;
  category: 'engine' | 'brakes' | 'tires' | 'fluids' | 'electrical' | 'general';
}

interface VehicleInfo {
  vin: string;
  make: string;
  model: string;
  year: number;
  currentMileage: number;
  lastServiceDate?: Date;
}

interface MaintenanceReminderEngineProps {
  vehicleInfo: VehicleInfo;
  onScheduleService: (serviceType: string, estimatedCost: number) => void;
}

export function MaintenanceReminderEngine({ vehicleInfo, onScheduleService }: MaintenanceReminderEngineProps) {
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateMaintenanceSchedule();
  }, [vehicleInfo]);

  const generateMaintenanceSchedule = () => {
    setLoading(true);
    
    // Simulate API call to generate maintenance schedule based on VIN and mileage
    setTimeout(() => {
      const schedule = createMaintenanceSchedule(vehicleInfo);
      setMaintenanceItems(schedule);
      setLoading(false);
    }, 1000);
  };

  const createMaintenanceSchedule = (vehicle: VehicleInfo): MaintenanceItem[] => {
    const currentMileage = vehicle.currentMileage;
    const currentDate = new Date();
    
    // Base maintenance schedule (this would come from manufacturer data in production)
    const baseSchedule = [
      {
        service: 'Oil Change',
        intervalMiles: 5000,
        intervalMonths: 6,
        category: 'engine' as const,
        estimatedCost: 45,
        priority: 'high' as const,
        description: 'Regular oil and filter change to keep engine running smoothly',
      },
      {
        service: 'Tire Rotation',
        intervalMiles: 7500,
        intervalMonths: 6,
        category: 'tires' as const,
        estimatedCost: 35,
        priority: 'medium' as const,
        description: 'Rotate tires to ensure even wear and extend tire life',
      },
      {
        service: 'Brake Inspection',
        intervalMiles: 12000,
        intervalMonths: 12,
        category: 'brakes' as const,
        estimatedCost: 85,
        priority: 'high' as const,
        description: 'Inspect brake pads, rotors, and brake fluid',
      },
      {
        service: 'Air Filter Replacement',
        intervalMiles: 15000,
        intervalMonths: 12,
        category: 'engine' as const,
        estimatedCost: 25,
        priority: 'medium' as const,
        description: 'Replace engine air filter for optimal performance',
      },
      {
        service: 'Transmission Service',
        intervalMiles: 30000,
        intervalMonths: 24,
        category: 'fluids' as const,
        estimatedCost: 150,
        priority: 'high' as const,
        description: 'Change transmission fluid and filter',
      },
      {
        service: 'Coolant Flush',
        intervalMiles: 30000,
        intervalMonths: 24,
        category: 'fluids' as const,
        estimatedCost: 120,
        priority: 'medium' as const,
        description: 'Flush and replace engine coolant',
      },
      {
        service: 'Spark Plugs',
        intervalMiles: 30000,
        intervalMonths: 36,
        category: 'engine' as const,
        estimatedCost: 180,
        priority: 'medium' as const,
        description: 'Replace spark plugs for optimal engine performance',
      },
      {
        service: 'Timing Belt',
        intervalMiles: 60000,
        intervalMonths: 60,
        category: 'engine' as const,
        estimatedCost: 450,
        priority: 'high' as const,
        description: 'Replace timing belt to prevent engine damage',
      },
    ];

    // Generate upcoming maintenance items
    const upcomingItems: MaintenanceItem[] = [];

    baseSchedule.forEach((item, index) => {
      // Calculate next service mileage
      const lastServiceMileage = Math.floor(currentMileage / item.intervalMiles) * item.intervalMiles;
      const nextServiceMileage = lastServiceMileage + item.intervalMiles;
      
      // Calculate next service date
      const monthsUntilService = Math.ceil((nextServiceMileage - currentMileage) / 1000); // Assume 1000 miles per month
      const nextServiceDate = new Date(currentDate);
      nextServiceDate.setMonth(nextServiceDate.getMonth() + Math.max(1, monthsUntilService));

      // Only include items due within the next 12 months or 15,000 miles
      const milesUntilService = nextServiceMileage - currentMileage;
      if (milesUntilService <= 15000 && monthsUntilService <= 12) {
        upcomingItems.push({
          id: `maintenance-${index}`,
          service: item.service,
          dueDate: nextServiceDate,
          dueMileage: nextServiceMileage,
          priority: milesUntilService <= 2000 ? 'high' : item.priority,
          description: item.description,
          estimatedCost: item.estimatedCost,
          category: item.category,
        });
      }
    });

    // Sort by urgency (mileage until due)
    return upcomingItems.sort((a, b) => {
      const aMilesUntil = a.dueMileage - currentMileage;
      const bMilesUntil = b.dueMileage - currentMileage;
      return aMilesUntil - bMilesUntil;
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return Colors.error;
      case 'medium': return Colors.warning;
      case 'low': return Colors.success;
      default: return Colors.textMuted;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'engine': return Icons.Zap;
      case 'brakes': return Icons.Disc;
      case 'tires': return Icons.Circle;
      case 'fluids': return Icons.Droplets;
      case 'electrical': return Icons.Battery;
      default: return Icons.Wrench;
    }
  };

  const formatMilesUntilDue = (dueMileage: number) => {
    const milesUntil = dueMileage - vehicleInfo.currentMileage;
    if (milesUntil <= 0) return 'Overdue';
    if (milesUntil <= 1000) return `${milesUntil} miles`;
    return `${Math.round(milesUntil / 1000)}k miles`;
  };

  const handleScheduleService = (item: MaintenanceItem) => {
    Alert.alert(
      'Schedule Service',
      `Schedule ${item.service}?\n\nEstimated cost: $${item.estimatedCost}\nDue: ${formatMilesUntilDue(item.dueMileage)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Schedule', 
          onPress: () => onScheduleService(item.service, item.estimatedCost)
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Icons.Clock size={32} color={Colors.primary} />
          <Text style={styles.loadingText}>Analyzing maintenance schedule...</Text>
          <Text style={styles.loadingSubtext}>
            Based on {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icons.Calendar size={24} color={Colors.primary} />
        <Text style={styles.title}>Maintenance Schedule</Text>
      </View>

      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleText}>
          {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
        </Text>
        <Text style={styles.mileageText}>
          Current: {vehicleInfo.currentMileage.toLocaleString()} miles
        </Text>
      </View>

      {maintenanceItems.length === 0 ? (
        <View style={styles.noItemsContainer}>
          <Icons.CheckCircle size={48} color={Colors.success} />
          <Text style={styles.noItemsTitle}>All Caught Up!</Text>
          <Text style={styles.noItemsText}>
            No maintenance items due in the next 12 months or 15,000 miles.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
          {maintenanceItems.map((item) => {
            const IconComponent = getCategoryIcon(item.category);
            const milesUntil = item.dueMileage - vehicleInfo.currentMileage;
            const isOverdue = milesUntil <= 0;
            const isUrgent = milesUntil <= 2000;

            return (
              <View 
                key={item.id} 
                style={[
                  styles.maintenanceItem,
                  isOverdue && styles.overdueItem,
                  isUrgent && styles.urgentItem,
                ]}
              >
                <View style={styles.itemHeader}>
                  <View style={styles.itemTitleRow}>
                    <IconComponent size={20} color={getPriorityColor(item.priority)} />
                    <Text style={styles.itemTitle}>{item.service}</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
                      <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                        {item.priority.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.itemDescription}>{item.description}</Text>

                <View style={styles.itemDetails}>
                  <View style={styles.detailRow}>
                    <Icons.Gauge size={16} color={Colors.textMuted} />
                    <Text style={styles.detailText}>
                      Due at {item.dueMileage.toLocaleString()} miles ({formatMilesUntilDue(item.dueMileage)})
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Icons.Calendar size={16} color={Colors.textMuted} />
                    <Text style={styles.detailText}>
                      Due by {item.dueDate.toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Icons.DollarSign size={16} color={Colors.textMuted} />
                    <Text style={styles.detailText}>
                      Estimated cost: ${item.estimatedCost}
                    </Text>
                  </View>
                </View>

                <Button
                  title="Schedule Service"
                  onPress={() => handleScheduleService(item)}
                  style={[
                    styles.scheduleButton,
                    isOverdue && styles.overdueButton,
                    isUrgent && styles.urgentButton,
                  ]}
                />
              </View>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <Icons.Info size={16} color={Colors.textMuted} />
        <Text style={styles.footerText}>
          Maintenance schedule based on manufacturer recommendations and your vehicle's current mileage.
        </Text>
      </View>
    </View>
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
    gap: 12,
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
  },
  vehicleInfo: {
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  vehicleText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  mileageText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  noItemsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noItemsTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  noItemsText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  itemsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  maintenanceItem: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  overdueItem: {
    borderColor: Colors.error,
    backgroundColor: Colors.error + '05',
  },
  urgentItem: {
    borderColor: Colors.warning,
    backgroundColor: Colors.warning + '05',
  },
  itemHeader: {
    marginBottom: 8,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  itemDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  itemDetails: {
    gap: 6,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  scheduleButton: {
    backgroundColor: Colors.primary,
  },
  overdueButton: {
    backgroundColor: Colors.error,
  },
  urgentButton: {
    backgroundColor: Colors.warning,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 20,
    paddingTop: 16,
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
});