import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/auth-store';
import { SERVICE_CATEGORIES } from '@/constants/services';
import { Quote } from '@/types/service';
import { ChatComponent } from '@/components/ChatComponent';
import { PaymentModal } from '@/components/PaymentModal';
import { trpc } from '@/lib/trpc';
import * as Icons from 'lucide-react-native';

export default function CustomerQuotesScreen() {
  const { user } = useAuthStore();
  const utils = trpc.useUtils();
  const { data: jobsData, isLoading: jobsLoading } = trpc.job.getAll.useQuery();
  const { data: quotesData, isLoading: quotesLoading } = trpc.quote.listMine.useQuery();
  const markPaidMutation = trpc.quote.markPaid.useMutation();
  const declineQuoteMutation = trpc.quote.decline.useMutation();
  const jobs = jobsData?.jobs ?? [];
  const quotes = quotesData?.quotes ?? [];
  const isLoading = jobsLoading || quotesLoading;
  type JobItem = typeof jobs[number];
  type QuoteItem = typeof quotes[number];
  const [selectedRequestForChat, setSelectedRequestForChat] = React.useState<string | null>(null);
  const [selectedQuoteForPayment, setSelectedQuoteForPayment] = React.useState<Quote | null>(null);
  const [selectedBackendQuoteId, setSelectedBackendQuoteId] = React.useState<string | null>(null);

  const getServiceTitle = (type: string) => {
    return SERVICE_CATEGORIES.find(s => s.id === type)?.title || type;
  };

  const getStatusColor = (status: string) => {
    const normalized = status.toLowerCase();
    switch (normalized) {
      case 'pending': return Colors.warning;
      case 'quoted': return Colors.primary;
      case 'accepted': return Colors.success;
      case 'in_progress': return Colors.primary;
      case 'completed': return Colors.success;
      case 'approved': return Colors.primary;
      case 'declined': return Colors.error;
      case 'paid': return Colors.success;
      default: return Colors.textMuted;
    }
  };

  const getStatusText = (status: string) => {
    const normalized = status.toLowerCase();
    switch (normalized) {
      case 'pending': return 'Awaiting Quote';
      case 'quoted': return 'Quote Ready';
      case 'accepted': return 'Accepted';
      case 'approved': return 'Approved';
      case 'declined': return 'Declined';
      case 'paid': return 'Paid';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return normalized;
    }
  };

  const getLatestQuoteForJob = (jobId: string) => {
    const jobQuotes = quotes.filter((quote: QuoteItem) => quote.jobId === jobId);
    return jobQuotes.sort((a: QuoteItem, b: QuoteItem) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  };

  const getDisplayStatus = (job: JobItem, quote?: QuoteItem) => {
    if (!quote) {
      return job.status;
    }
    if (quote.status.toLowerCase() === 'pending') {
      return 'quoted';
    }
    return quote.status;
  };

  const mapQuoteForPayment = (quote: QuoteItem): Quote => ({
    id: quote.id,
    serviceRequestId: quote.jobId ?? '',
    description: quote.description ?? undefined,
    laborCost: quote.laborCost,
    partsCost: quote.partsCost,
    totalCost: quote.totalCost,
    estimatedDuration: quote.estimatedDuration,
    validUntil: quote.validUntil,
    status: quote.status.toLowerCase() as Quote['status'],
    createdAt: quote.createdAt,
    createdBy: quote.createdBy,
  });

  const handleAcceptQuote = (quoteId: string) => {
    const quote = quotes.find((q: QuoteItem) => q.id === quoteId);
    if (!quote) return;

    Alert.alert(
      'Accept Quote',
      `Accept quote for $${quote.totalCost}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept & Pay',
          onPress: () => {
            setSelectedBackendQuoteId(quote.id);
            setSelectedQuoteForPayment(mapQuoteForPayment(quote));
          }
        }
      ]
    );
  };

  const handlePaymentSuccess = async () => {
    if (!selectedBackendQuoteId) return;

    try {
      await markPaidMutation.mutateAsync({ quoteId: selectedBackendQuoteId });
      await utils.quote.listMine.invalidate();
      await utils.job.getAll.invalidate();
      setSelectedBackendQuoteId(null);
      setSelectedQuoteForPayment(null);
      Alert.alert('Payment Successful', 'Your payment has been processed. We will contact you to schedule the service.');
    } catch (error) {
      Alert.alert('Payment Failed', 'Unable to finalize payment. Please try again.');
    }
  };

  const handleDeclineQuote = (quoteId: string) => {
    const quote = quotes.find((q: QuoteItem) => q.id === quoteId);
    if (!quote) return;

    Alert.alert(
      'Decline Quote',
      'Are you sure you want to decline this quote?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await declineQuoteMutation.mutateAsync({ quoteId });
              await utils.quote.listMine.invalidate();
              await utils.job.getAll.invalidate();
            } catch (error) {
              Alert.alert('Error', 'Failed to decline quote');
            }
          }
        }
      ]
    );
  };

  const openChat = (requestId: string) => {
    setSelectedRequestForChat(requestId);
  };

  if (selectedRequestForChat) {
    return (
      <View style={styles.container}>
        <View style={styles.chatHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedRequestForChat(null)}
          >
            <Icons.ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.chatHeaderTitle}>Service Chat</Text>
        </View>
        <ChatComponent
          serviceRequestId={selectedRequestForChat}
          currentUserId={user?.id || 'customer-1'}
          currentUserName={user ? `${user.firstName} ${user.lastName}` : 'Customer'}
          currentUserType="customer"
        />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Loading requests...</Text>
      </View>
    );
  }

  if (jobs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icons.FileText size={64} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>No Service Requests</Text>
        <Text style={styles.emptyText}>
          Your service requests and quotes will appear here once you submit a request.
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {jobs.map((job: JobItem) => {
            const requestQuote = getLatestQuoteForJob(job.id);
            const displayStatus = getDisplayStatus(job, requestQuote);
            
            return (
              <View key={job.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View style={styles.requestTitleRow}>
                    <Text style={styles.requestTitle}>
                      {getServiceTitle(job.serviceType)}
                    </Text>
                  </View>
                  
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(displayStatus) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(displayStatus) }]}>
                      {getStatusText(displayStatus)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.requestDescription} numberOfLines={2}>
                  {job.description}
                </Text>

                {/* Photos */}
                {job.customerPhotos && job.customerPhotos.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosContainer}>
                    {job.customerPhotos.map((photo: string, index: number) => (
                      <View key={index} style={styles.photoWrapper}>
                        <Image source={{ uri: photo }} style={styles.photo} />
                      </View>
                    ))}
                  </ScrollView>
                )}

                <View style={styles.requestMeta}>
                  <Text style={styles.requestDate}>
                    {job.createdAt.toLocaleDateString()}
                  </Text>
                  {job.address && (
                    <View style={styles.locationRow}>
                      <Icons.MapPin size={12} color={Colors.textMuted} />
                      <Text style={styles.locationText}>
                        {job.address || 'Location provided'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.chatButton}
                    onPress={() => openChat(job.id)}
                  >
                    <Icons.MessageCircle size={16} color={Colors.primary} />
                    <Text style={styles.chatButtonText}>Chat</Text>
                  </TouchableOpacity>
                </View>

                {requestQuote && (
                  <View style={styles.quoteSection}>
                    <View style={styles.quoteDivider} />
                    
                    <View style={styles.quoteHeader}>
                      <Text style={styles.quoteTitle}>Quote Details</Text>
                      <Text style={styles.quoteTotal}>${requestQuote.totalCost}</Text>
                    </View>

                    <Text style={styles.quoteDescription}>{requestQuote.description}</Text>

                    <View style={styles.quoteBreakdown}>
                      <View style={styles.quoteRow}>
                        <Text style={styles.quoteLabel}>Labor</Text>
                        <Text style={styles.quoteValue}>${requestQuote.laborCost}</Text>
                      </View>
                      <View style={styles.quoteRow}>
                        <Text style={styles.quoteLabel}>Parts</Text>
                        <Text style={styles.quoteValue}>${requestQuote.partsCost}</Text>
                      </View>
                      <View style={styles.quoteRow}>
                        <Text style={styles.quoteLabel}>Estimated Time</Text>
                        <Text style={styles.quoteValue}>{requestQuote.estimatedDuration}h</Text>
                      </View>
                      <View style={styles.quoteRow}>
                        <Text style={styles.quoteLabel}>Valid Until</Text>
                        <Text style={styles.quoteValue}>
                          {new Date(requestQuote.validUntil).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>

                    {displayStatus.toLowerCase() === 'quoted' && requestQuote.status.toLowerCase() === 'pending' && (
                      <View style={styles.quoteActions}>
                        <TouchableOpacity 
                          style={styles.acceptButton}
                          onPress={() => handleAcceptQuote(requestQuote.id)}
                        >
                          <Text style={styles.acceptButtonText}>Accept & Pay</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.declineButton}
                          onPress={() => handleDeclineQuote(requestQuote.id)}
                        >
                          <Text style={styles.declineButtonText}>Decline</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {requestQuote.status.toLowerCase() === 'paid' && (
                      <View style={styles.paidIndicator}>
                        <Icons.CheckCircle size={16} color={Colors.success} />
                        <Text style={styles.paidText}>
                          Payment received
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Payment Modal */}
      {selectedQuoteForPayment && (
        <PaymentModal
          quote={selectedQuoteForPayment}
          onSuccess={handlePaymentSuccess}
          onCancel={() => {
            setSelectedQuoteForPayment(null);
            setSelectedBackendQuoteId(null);
          }}
        />
      )}
    </>
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
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    marginRight: 12,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requestTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requestDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  photosContainer: {
    marginBottom: 12,
  },
  photoWrapper: {
    marginRight: 8,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photo: {
    width: 72,
    height: 72,
    backgroundColor: Colors.card,
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  chatButtonText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  quoteSection: {
    marginTop: 16,
  },
  quoteDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 16,
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
  quoteTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  quoteDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  quoteBreakdown: {
    gap: 8,
    marginBottom: 16,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  quoteValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  quoteActions: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: Colors.black,
    fontWeight: '600',
    fontSize: 16,
  },
  declineButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  declineButtonText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 16,
  },
  paidIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.success + '20',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  paidText: {
    color: Colors.success,
    fontWeight: '600',
    fontSize: 14,
  },
});
