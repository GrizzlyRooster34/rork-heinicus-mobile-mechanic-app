import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Alert } from 'react-native';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { trpc } from '@/lib/trpc';
import { getPartEstimate, calculatePartsTotal } from '@/utils/parts/getPartEstimate';
import * as Icons from 'lucide-react-native';

interface PartsApprovalToggleProps {
  jobId: string;
  partsNeeded: string[];
  currentApprovalStatus: boolean;
  onApprovalChange: (approved: boolean, estimatedCost?: number) => void;
}

export function PartsApprovalToggle({ 
  jobId, 
  partsNeeded, 
  currentApprovalStatus, 
  onApprovalChange 
}: PartsApprovalToggleProps) {
  const [isApproved, setIsApproved] = useState(currentApprovalStatus);
  const [showDetails, setShowDetails] = useState(false);

  const updatePartsApprovalMutation = trpc.job.updatePartsApproval.useMutation({
    onSuccess: (data) => {
      console.log('Parts approval updated successfully:', data);
    },
    onError: (error) => {
      console.error('Failed to update parts approval:', error);
      Alert.alert('Error', 'Failed to update parts approval. Please try again.');
    },
  });

  // Calculate parts estimates
  const partsCalculation = calculatePartsTotal(partsNeeded);
  const hasPartsEstimates = partsCalculation.foundCount > 0;

  const handleToggleApproval = async (value: boolean) => {
    try {
      await updatePartsApprovalMutation.mutateAsync({
        jobId,
        partsApproved: value,
        estimatedPartsCost: hasPartsEstimates ? partsCalculation.total : undefined,
      });

      setIsApproved(value);
      onApprovalChange(value, hasPartsEstimates ? partsCalculation.total : undefined);

      Alert.alert(
        value ? 'Parts Approved' : 'Parts Approval Removed',
        value 
          ? 'You have pre-approved the estimated parts cost. Work can proceed without additional confirmation.'
          : 'Parts will need individual approval before purchase.'
      );
    } catch (error) {
      console.error('Error updating parts approval:', error);
    }
  };

  const handleShowDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icons.Package size={20} color={Colors.primary} />
        <Text style={styles.title}>Parts Approval</Text>
      </View>

      <View style={styles.toggleSection}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Pre-approve parts cost</Text>
            <Text style={styles.toggleDescription}>
              {isApproved 
                ? 'Parts can be purchased without additional confirmation'
                : 'Each part will require individual approval before purchase'
              }
            </Text>
          </View>
          <Switch
            value={isApproved}
            onValueChange={handleToggleApproval}
            trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
            thumbColor={isApproved ? Colors.primary : Colors.textMuted}
            disabled={updatePartsApprovalMutation.isPending}
          />
        </View>
      </View>

      {partsNeeded.length > 0 && (
        <View style={styles.partsSection}>
          <View style={styles.partsSummary}>
            <View style={styles.partsHeader}>
              <Text style={styles.partsTitle}>Required Parts ({partsNeeded.length})</Text>
              <Button
                title={showDetails ? 'Hide Details' : 'Show Details'}
                variant="outline"
                onPress={handleShowDetails}
                style={styles.detailsButton}
              />
            </View>

            {hasPartsEstimates && (
              <View style={styles.costSummary}>
                <Text style={styles.costLabel}>Estimated Total:</Text>
                <Text style={styles.costValue}>${partsCalculation.total.toFixed(2)}</Text>
              </View>
            )}
          </View>

          {showDetails && (
            <View style={styles.partsDetails}>
              {partsCalculation.breakdown.map((part, index) => (
                <View key={index} style={styles.partItem}>
                  <View style={styles.partInfo}>
                    <Text style={styles.partName}>{part.name}</Text>
                    <Text style={styles.partCategory}>{part.category}</Text>
                    {part.brand && (
                      <Text style={styles.partBrand}>Brand: {part.brand}</Text>
                    )}
                  </View>
                  <View style={styles.partPricing}>
                    <Text style={styles.partPrice}>${part.price.toFixed(2)}</Text>
                    <View style={[
                      styles.availabilityBadge,
                      part.availability === 'in-stock' && styles.inStockBadge,
                      part.availability === 'special-order' && styles.specialOrderBadge,
                    ]}>
                      <Text style={[
                        styles.availabilityText,
                        part.availability === 'in-stock' && styles.inStockText,
                        part.availability === 'special-order' && styles.specialOrderText,
                      ]}>
                        {part.availability === 'in-stock' ? 'In Stock' : 'Special Order'}
                      </Text>
                    </View>
                    {part.estimatedDelivery && (
                      <Text style={styles.deliveryText}>{part.estimatedDelivery}</Text>
                    )}
                  </View>
                </View>
              ))}

              {partsCalculation.notFoundCount > 0 && (
                <View style={styles.notFoundSection}>
                  <Text style={styles.notFoundTitle}>
                    {partsCalculation.notFoundCount} part(s) need manual pricing
                  </Text>
                  <Text style={styles.notFoundDescription}>
                    These parts will be priced individually by the mechanic
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      <View style={styles.infoSection}>
        <Icons.Info size={16} color={Colors.textMuted} />
        <Text style={styles.infoText}>
          {isApproved
            ? 'With parts pre-approved, your mechanic can purchase necessary parts immediately, reducing service time.'
            : 'Without pre-approval, you will be contacted for each part before purchase, which may extend service time.'
          }
        </Text>
      </View>

      {updatePartsApprovalMutation.isPending && (
        <View style={styles.loadingSection}>
          <Text style={styles.loadingText}>Updating parts approval...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  toggleSection: {
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  partsSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
    marginBottom: 16,
  },
  partsSummary: {
    marginBottom: 12,
  },
  partsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  partsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  detailsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  costSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    padding: 12,
    borderRadius: 8,
  },
  costLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  costValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  partsDetails: {
    gap: 12,
  },
  partItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
  },
  partInfo: {
    flex: 1,
    marginRight: 12,
  },
  partName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  partCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  partBrand: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  partPricing: {
    alignItems: 'flex-end',
  },
  partPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  inStockBadge: {
    backgroundColor: Colors.success + '20',
  },
  specialOrderBadge: {
    backgroundColor: Colors.warning + '20',
  },
  availabilityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  inStockText: {
    color: Colors.success,
  },
  specialOrderText: {
    color: Colors.warning,
  },
  deliveryText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  notFoundSection: {
    backgroundColor: Colors.warning + '10',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  notFoundTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warning,
    marginBottom: 4,
  },
  notFoundDescription: {
    fontSize: 12,
    color: Colors.warning,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  loadingSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});