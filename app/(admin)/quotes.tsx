import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/auth-store';
import { useAppStore } from '@/stores/app-store';
import { SERVICE_CATEGORIES } from '@/constants/services';
import * as Icons from 'lucide-react-native';

export default function AdminQuotesScreen() {
  const { user } = useAuthStore();
  const { serviceRequests, quotes, updateQuote, updateServiceRequest, addQuote } = useAppStore();
  const [selectedTab, setSelectedTab] = useState<'pending' | 'accepted' | 'all'>('pending');

  const getServiceTitle = (type: string) => {
    return SERVICE_CATEGORIES.find(s => s.id === type)?.title || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return Colors.warning;
      case 'quoted': return Colors.primary;
      case 'accepted': return Colors.success;
      case 'rejected': return Colors.error;
      case 'paid': return Colors.success;
      default: return Colors.textMuted;
    }
  };

  const handleCreateQuote = (requestId: string) => {
    const request = serviceRequests.find(r => r.id === requestId);
    if (!request) return;

    Alert.prompt(
      'Create Quote',
      'Enter the total cost for this service:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: (totalCost) => {
            if (!totalCost || isNaN(Number(totalCost))) {
              Alert.alert('Error', 'Please enter a valid amount');
              return;
            }

            const newQuote = {
              id: `quote-${Date.now()}`,
              serviceRequestId: requestId,
              description: `Professional ${getServiceTitle(request.type)} service`,
              laborCost: Number(totalCost) * 0.7,
              partsCost: Number(totalCost) * 0.3,
              totalCost: Number(totalCost),
              estimatedDuration: 2,
              validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
              status: 'pending' as const,
              createdAt: new Date(),
              createdBy: user?.id || 'admin',
            };

            addQuote(newQuote);
            updateServiceRequest(requestId, { status: 'quoted' });
            Alert.alert('Success', 'Quote created successfully');
          }
        }
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const handleAcceptQuote = (quoteId: string) => {
    updateQuote(quoteId, { status: 'accepted' });
    const quote = quotes.find(q => q.id === quoteId);
    if (quote) {
      updateServiceRequest(quote.serviceRequestId, { status: 'accepted' });
    }
    Alert.alert('Success', 'Quote accepted and job scheduled');
  };

  const handleRejectQuote = (quoteId: string) => {
    updateQuote(quoteId, { status: 'rejected' });
    const quote = quotes.find(q => q.id === quoteId);
    if (quote) {
      updateServiceRequest(quote.serviceRequestId, { status: 'pending' });
    }
    Alert.alert('Quote Rejected', 'Quote has been rejected');
  };

  const filteredRequests = serviceRequests.filter(request => {
    const hasQuote = quotes.some(q => q.serviceRequestId === request.id);
    
    switch (selectedTab) {
      case 'pending':
        return !hasQuote && request.status === 'pending';
      case 'accepted':
        return hasQuote && quotes.find(q => q.serviceRequestId === request.id)?.status === 'accepted';
      case 'all':
        return true;
      default:
        return false;
    }
  });

  if (user?.role !== 'admin') {
    return (
      <View style={styles.unauthorizedContainer}>
        <Icons.Shield size={64} color={Colors.error} />
        <Text style={styles.unauthorizedTitle}>Access Denied</Text>
        <Text style={styles.unauthorizedText}>
          You do not have permission to manage quotes.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quote Management</Text>
        <Text style={styles.headerSubtitle}>
          Create and manage service quotes
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'pending', label: 'Pending Quotes', count: serviceRequests.filter(r => !quotes.some(q => q.serviceRequestId === r.id) && r.status === 'pending').length },
          { key: 'accepted', label: 'Accepted', count: quotes.filter(q => q.status === 'accepted').length },
          { key: 'all', label: 'All Requests', count: serviceRequests.length },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
              {tab.label} ({tab.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Requests List */}
      <ScrollView style={styles.requestsList} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {filteredRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icons.FileText size={64} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No {selectedTab} requests</Text>
              <Text style={styles.emptyText}>
                {selectedTab === 'pending' && 'New service requests will appear here'}
                {selectedTab === 'accepted' && 'Accepted quotes will appear here'}
                {selectedTab === 'all' && 'All service requests will appear here'}
              </Text>
            </View>
          ) : (
            filteredRequests.map((request) => {
              const requestQuote = quotes.find(q => q.serviceRequestId === request.id);
              
              return (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <Text style={styles.requestTitle}>
                      {getServiceTitle(request.type)}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(request.status) + '20' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: getStatusColor(request.status) }
                      ]}>
                        {request.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.requestDescription} numberOfLines={2}>
                    {request.description}
                  </Text>

                  <View style={styles.requestMeta}>
                    <Text style={styles.requestDate}>
                      {request.createdAt.toLocaleDateString()}
                    </Text>
                    {request.urgency === 'emergency' && (
                      <View style={styles.urgencyBadge}>
                        <Icons.AlertTriangle size={12} color={Colors.error} />
                        <Text style={styles.urgencyText}>Emergency</Text>
                      </View>
                    )}
                  </View>

                  {/* Quote Section */}
                  {requestQuote ? (
                    <View style={styles.quoteSection}>
                      <View style={styles.quoteDivider} />
                      <View style={styles.quoteHeader}>
                        <Text style={styles.quoteTitle}>Quote</Text>
                        <Text style={styles.quoteAmount}>${requestQuote.totalCost}</Text>
                      </View>
                      
                      <View style={styles.quoteBreakdown}>
                        <Text style={styles.quoteBreakdownText}>
                          Labor: ${requestQuote.laborCost} • Parts: ${requestQuote.partsCost}
                        </Text>
                        <Text style={styles.quoteBreakdownText}>
                          Est. Time: {requestQuote.estimatedDuration}h
                        </Text>
                      </View>

                      {requestQuote.status === 'pending' && (
                        <View style={styles.quoteActions}>
                          <TouchableOpacity
                            style={styles.acceptButton}
                            onPress={() => handleAcceptQuote(requestQuote.id)}
                          >
                            <Icons.Check size={16} color={Colors.white} />
                            <Text style={styles.acceptButtonText}>Accept</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={styles.rejectButton}
                            onPress={() => handleRejectQuote(requestQuote.id)}
                          >
                            <Icons.X size={16} color={Colors.error} />
                            <Text style={styles.rejectButtonText}>Reject</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {requestQuote.status !== 'pending' && (
                        <View style={[
                          styles.quoteStatusBadge,
                          { backgroundColor: getStatusColor(requestQuote.status) + '20' }
                        ]}>
                          <Text style={[
                            styles.quoteStatusText,
                            { color: getStatusColor(requestQuote.status) }
                          ]}>
                            {requestQuote.status.toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.actionSection}>
                      <TouchableOpacity
                        style={styles.createQuoteButton}
                        onPress={() => handleCreateQuote(request.id)}
                      >
                        <Icons.FileText size={16} color={Colors.primary} />
                        <Text style={styles.createQuoteButtonText}>Create Quote</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  unauthorizedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: Colors.background,
  },
  unauthorizedTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  unauthorizedText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  requestsList: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 100,
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
  requestCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  requestDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  requestMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  urgencyText: {
    fontSize: 10,
    color: Colors.error,
    fontWeight: '600',
  },
  quoteSection: {
    marginTop: 12,
  },
  quoteDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 12,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quoteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  quoteAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  quoteBreakdown: {
    marginBottom: 12,
  },
  quoteBreakdownText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  quoteActions: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  acceptButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.error,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  rejectButtonText: {
    color: Colors.error,
    fontWeight: '600',
    fontSize: 14,
  },
  quoteStatusBadge: {
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  quoteStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionSection: {
    marginTop: 12,
  },
  createQuoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '20',
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createQuoteButtonText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});