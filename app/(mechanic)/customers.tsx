import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import * as Icons from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { SERVICE_CATEGORIES } from '@/constants/services';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/stores/auth-store';

type CustomerJob = {
  id: string;
  type: string;
  status: string;
  createdAt: Date;
};

type CustomerRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  requests: CustomerJob[];
  totalSpent: number;
  lastService: Date;
};

const toUiStatus = (status: string, hasPendingQuote: boolean) => {
  if (status === 'PENDING' && hasPendingQuote) return 'quoted';
  return status.toLowerCase();
};

export default function MechanicCustomersScreen() {
  const { user } = useAuthStore();
  const { data: jobsData, isLoading } = trpc.job.getAll.useQuery();
  const jobs = jobsData?.jobs ?? [];
  const [searchQuery, setSearchQuery] = useState('');

  const customers = useMemo(() => {
    const mechanicId = user?.id;
    const ownedJobs = jobs.filter((job) => !mechanicId || job.mechanicId === mechanicId);

    const grouped = ownedJobs.reduce((acc, job) => {
      const customerName = `${job.customer.firstName} ${job.customer.lastName}`.trim();
      const customerId = job.customerId;
      const paidOrAcceptedQuotes = (job.quotes ?? []).filter((quote) => (
        quote.status === 'PAID' || quote.status === 'ACCEPTED'
      ));

      if (!acc[customerId]) {
        acc[customerId] = {
          id: customerId,
          name: customerName || 'Customer',
          email: job.customer.email,
          phone: 'Not provided',
          requests: [],
          totalSpent: 0,
          lastService: new Date(job.createdAt),
        };
      }

      const hasPendingQuote = (job.quotes ?? []).some((quote) => quote.status === 'PENDING');
      acc[customerId].requests.push({
        id: job.id,
        type: job.serviceType,
        status: toUiStatus(job.status, hasPendingQuote),
        createdAt: new Date(job.createdAt),
      });
      acc[customerId].totalSpent += paidOrAcceptedQuotes.reduce((sum, quote) => sum + quote.totalCost, 0);

      const createdAt = new Date(job.createdAt);
      if (createdAt > acc[customerId].lastService) {
        acc[customerId].lastService = createdAt;
      }

      return acc;
    }, {} as Record<string, CustomerRecord>);

    const list = Object.values(grouped).map((customer) => ({
      ...customer,
      requests: [...customer.requests].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    }));

    return list.filter((customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [jobs, searchQuery, user?.id]);

  const getServiceTitle = (type: string) => {
    return SERVICE_CATEGORIES.find((service) => service.id === type)?.title || type;
  };

  if (isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Loading customers...</Text>
      </View>
    );
  }

  if (customers.length === 0 && searchQuery === '') {
    return (
      <View style={styles.emptyContainer}>
        <Icons.Users size={64} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>No Customers Yet</Text>
        <Text style={styles.emptyText}>
          Customer information will appear here once you start serving clients.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Icons.Search size={20} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search customers..."
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <ScrollView style={styles.customersList} showsVerticalScrollIndicator={false}>
        {customers.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No customers found</Text>
          </View>
        ) : (
          customers.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} getServiceTitle={getServiceTitle} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

interface CustomerCardProps {
  customer: CustomerRecord;
  getServiceTitle: (type: string) => string;
}

function CustomerCard({ customer, getServiceTitle }: CustomerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={styles.customerCard}>
      <TouchableOpacity style={styles.customerHeader} onPress={() => setIsExpanded(!isExpanded)}>
        <View style={styles.customerInfo}>
          <View style={styles.customerAvatar}>
            <Text style={styles.customerInitials}>
              {customer.name
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          </View>

          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>{customer.name}</Text>
            <Text style={styles.customerEmail}>{customer.email}</Text>
            <Text style={styles.customerPhone}>{customer.phone}</Text>
          </View>
        </View>

        <View style={styles.customerStats}>
          <Text style={styles.statValue}>${customer.totalSpent.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Spent</Text>
          <Text style={styles.serviceCount}>{customer.requests.length} services</Text>
        </View>

        <Icons.ChevronDown
          size={20}
          color={Colors.textMuted}
          style={[styles.expandIcon, isExpanded && styles.expandIconRotated]}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.customerExpanded}>
          <View style={styles.expandedHeader}>
            <Text style={styles.expandedTitle}>Service History</Text>
            <Text style={styles.lastService}>
              Last service: {customer.lastService.toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.serviceHistory}>
            {customer.requests.slice(0, 3).map((request) => (
              <View key={request.id} style={styles.serviceItem}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{getServiceTitle(request.type)}</Text>
                  <Text style={styles.serviceDate}>
                    {new Date(request.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.serviceStatus, { backgroundColor: getStatusColor(request.status) + '20' }]}>
                  <Text style={[styles.serviceStatusText, { color: getStatusColor(request.status) }]}>
                    {request.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>
            ))}

            {customer.requests.length > 3 && (
              <Text style={styles.moreServices}>
                +{customer.requests.length - 3} more services
              </Text>
            )}
          </View>

          <View style={styles.customerActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Icons.Phone size={16} color={Colors.mechanic} />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Icons.MessageCircle size={16} color={Colors.mechanic} />
              <Text style={styles.actionButtonText}>Message</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Icons.Mail size={16} color={Colors.mechanic} />
              <Text style={styles.actionButtonText}>Email</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pending': return Colors.warning;
    case 'quoted': return Colors.primary;
    case 'accepted': return Colors.success;
    case 'in_progress': return Colors.mechanic;
    case 'completed': return Colors.success;
    case 'cancelled': return Colors.error;
    default: return Colors.textMuted;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
  },
  customersList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  noResultsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  customerCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.mechanic + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.mechanic,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  customerEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  customerStats: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  serviceCount: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  expandIcon: {
    transform: [{ rotate: '0deg' }],
  },
  expandIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  customerExpanded: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 16,
  },
  expandedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expandedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  lastService: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  serviceHistory: {
    marginBottom: 16,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  serviceDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  serviceStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  serviceStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  moreServices: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  customerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.mechanic + '20',
    borderWidth: 1,
    borderColor: Colors.mechanic,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  actionButtonText: {
    color: Colors.mechanic,
    fontSize: 12,
    fontWeight: '600',
  },
});
