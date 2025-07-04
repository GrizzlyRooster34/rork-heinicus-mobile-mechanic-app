import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button } from '@/components/Button';
import { Colors } from '@/constants/colors';
import * as Icons from 'lucide-react-native';

interface VehicleHistory {
  vin: string;
  mileage: number;
  oilChangeLast60Days: boolean;
  brakesCheckedLast90Days: boolean;
  timingBeltReplaced: boolean;
  lastServiceDate?: Date;
}

interface MaintenanceSuggestion {
  id: string;
  service: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  estimatedCost: number;
  urgency: string;
  icon: keyof typeof Icons;
}

interface MaintenanceSuggestionsProps {
  vin: string;
  onServiceSelect?: (suggestion: MaintenanceSuggestion) => void;
}

// Mock function to get vehicle history - in production this would be an API call
const getVehicleHistory = async (vin: string): Promise<VehicleHistory> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock data based on VIN
  return {
    vin,
    mileage: 85000,
    oilChangeLast60Days: false,
    brakesCheckedLast90Days: false,
    timingBeltReplaced: false,
    lastServiceDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
  };
};

export default function MaintenanceSuggestions({ 
  vin, 
  onServiceSelect 
}: MaintenanceSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<MaintenanceSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<VehicleHistory | null>(null);

  useEffect(() => {
    const generateSuggestions = async () => {
      if (!vin) return;
      
      setLoading(true);
      
      try {
        const vehicleHistory = await getVehicleHistory(vin);
        setHistory(vehicleHistory);
        
        const suggestions: MaintenanceSuggestion[] = [];

        // Oil change check
        if (!vehicleHistory.oilChangeLast60Days) {
          suggestions.push({
            id: 'oil-change',
            service: 'Oil Change',
            priority: 'high',
            reason: 'Oil change is overdue (recommended every 60 days)',
            estimatedCost: 45,
            urgency: 'Overdue',
            icon: 'Droplets',
          });
        }

        // Brake inspection check
        if (!vehicleHistory.brakesCheckedLast90Days) {
          suggestions.push({
            id: 'brake-inspection',
            service: 'Brake Inspection',
            priority: 'medium',
            reason: 'Brakes should be inspected every 90 days',
            estimatedCost: 120,
            urgency: 'Recommended',
            icon: 'Disc',
          });
        }

        // Timing belt check (high mileage)
        if (vehicleHistory.mileage > 100000 && !vehicleHistory.timingBeltReplaced) {
          suggestions.push({
            id: 'timing-belt',
            service: 'Timing Belt Service',
            priority: 'high',
            reason: `Vehicle has ${vehicleHistory.mileage.toLocaleString()} miles and timing belt hasn't been replaced`,
            estimatedCost: 650,
            urgency: 'Critical',
            icon: 'Settings',
          });
        }

        // Sort by priority
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        suggestions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
        
        setSuggestions(suggestions);
      } catch (error) {
        console.error('Error generating maintenance suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    generateSuggestions();
  }, [vin]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return Colors.error;
      case 'medium':
        return Colors.warning;
      case 'low':
        return Colors.success;
      default:
        return Colors.textMuted;
    }
  };

  const getIcon = (iconName: keyof typeof Icons) => {
    const IconComponent = Icons[iconName] as React.ComponentType<{ size: number; color: string }>;
    if (IconComponent) {
      return <IconComponent size={20} color={Colors.primary} />;
    }
    return <Icons.AlertCircle size={20} color={Colors.primary} />;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Analyzing maintenance history...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icons.Wrench size={24} color={Colors.primary} />
        <Text style={styles.title}>Maintenance Suggestions</Text>
      </View>

      {history && (
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleInfoText}>
            Vehicle: {history.mileage.toLocaleString()} miles
          </Text>
          <Text style={styles.vehicleInfoText}>
            VIN: {history.vin}
          </Text>
        </View>
      )}

      {suggestions.length === 0 ? (
        <View style={styles.noSuggestions}>
          <Icons.CheckCircle size={48} color={Colors.success} />
          <Text style={styles.noSuggestionsTitle}>All Caught Up!</Text>
          <Text style={styles.noSuggestionsText}>
            Your vehicle maintenance appears to be up to date. Keep up the good work!
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.suggestionsList} showsVerticalScrollIndicator={false}>
          {suggestions.map((suggestion) => (
            <View key={suggestion.id} style={styles.suggestionCard}>
              <View style={styles.suggestionHeader}>
                <View style={styles.suggestionTitleRow}>
                  {getIcon(suggestion.icon)}
                  <Text style={styles.suggestionService}>{suggestion.service}</Text>
                  <View style={[
                    styles.priorityBadge,
                    { backgroundColor: getPriorityColor(suggestion.priority) }
                  ]}>
                    <Text style={styles.priorityText}>{suggestion.urgency}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.suggestionReason}>{suggestion.reason}</Text>

              <View style={styles.suggestionFooter}>
                <Text style={styles.estimatedCost}>
                  Est. ${suggestion.estimatedCost}
                </Text>
                
                <Button
                  title="Schedule Service"
                  onPress={() => onServiceSelect?.(suggestion)}
                  style={styles.scheduleButton}
                  textStyle={styles.scheduleButtonText}
                />
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <Icons.Info size={16} color={Colors.textMuted} />
        <Text style={styles.footerText}>
          Suggestions based on vehicle history and manufacturer recommendations. 
          Actual service needs may vary based on driving conditions.
        </Text>
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
    maxHeight: 600,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  vehicleInfo: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  vehicleInfoText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  noSuggestions: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noSuggestionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.success,
    marginTop: 16,
    marginBottom: 8,
  },
  noSuggestionsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  suggestionsList: {
    flex: 1,
    marginBottom: 16,
  },
  suggestionCard: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionHeader: {
    marginBottom: 8,
  },
  suggestionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  suggestionService: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  suggestionReason: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  suggestionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  estimatedCost: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  scheduleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  scheduleButtonText: {
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
});