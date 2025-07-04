import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, Image } from 'react-native';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/auth-store';
import { useAppStore } from '@/stores/app-store';
import { SERVICE_CATEGORIES } from '@/constants/services';
import { JobPhoto } from '@/types/service';
import * as Icons from 'lucide-react-native';
import { useState } from 'react';

export default function AdminJobsScreen() {
  const { user } = useAuthStore();
  const { serviceRequests, quotes, getJobPhotos, getJobTimeline } = useAppStore();
  const [selectedJobPhotos, setSelectedJobPhotos] = useState<JobPhoto[] | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<JobPhoto | null>(null);

  const getServiceTitle = (type: string) => {
    return SERVICE_CATEGORIES.find(s => s.id === type)?.title || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return Colors.warning;
      case 'quoted': return Colors.primary;
      case 'accepted': return Colors.success;
      case 'scheduled': return Colors.secondary;
      case 'in_progress': return Colors.mechanic;
      case 'paused': return Colors.warning;
      case 'completed': return Colors.success;
      case 'cancelled': return Colors.error;
      default: return Colors.textMuted;
    }
  };

  const getTypeIcon = (type: JobPhoto['type']) => {
    switch (type) {
      case 'before': return 'Clock';
      case 'during': return 'Wrench';
      case 'after': return 'CheckCircle';
      case 'parts': return 'Package';
      case 'damage': return 'AlertTriangle';
      default: return 'Camera';
    }
  };

  const getTypeColor = (type: JobPhoto['type']) => {
    switch (type) {
      case 'before': return Colors.warning;
      case 'during': return Colors.mechanic;
      case 'after': return Colors.success;
      case 'parts': return Colors.secondary;
      case 'damage': return Colors.error;
      default: return Colors.primary;
    }
  };

  if (user?.role !== 'admin') {
    return (
      <View style={styles.unauthorizedContainer}>
        <Icons.Shield size={64} color={Colors.error} />
        <Text style={styles.unauthorizedTitle}>Access Denied</Text>
        <Text style={styles.unauthorizedText}>
          You do not have permission to view jobs.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Job Management</Text>
        <Text style={styles.headerSubtitle}>
          Monitor all service jobs and their progress
        </Text>
      </View>

      <ScrollView style={styles.jobsList} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {serviceRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icons.Briefcase size={64} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Jobs</Text>
              <Text style={styles.emptyText}>
                Service jobs will appear here once customers submit requests.
              </Text>
            </View>
          ) : (
            serviceRequests.map((job) => {
              const jobQuote = quotes.find(q => q.serviceRequestId === job.id);
              const jobPhotos = getJobPhotos(job.id);
              const timeline = getJobTimeline(job.id);
              
              return (
                <View key={job.id} style={styles.jobCard}>
                  <View style={styles.jobHeader}>
                    <Text style={styles.jobTitle}>
                      {getServiceTitle(job.type)}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(job.status) + '20' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: getStatusColor(job.status) }
                      ]}>
                        {job.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.jobDescription} numberOfLines={2}>
                    {job.description}
                  </Text>

                  <View style={styles.jobMeta}>
                    <View style={styles.metaRow}>
                      <Icons.Calendar size={14} color={Colors.textMuted} />
                      <Text style={styles.metaText}>
                        {job.createdAt.toLocaleDateString()}
                      </Text>
                    </View>
                    
                    {job.urgency === 'emergency' && (
                      <View style={styles.metaRow}>
                        <Icons.AlertTriangle size={14} color={Colors.error} />
                        <Text style={[styles.metaText, { color: Colors.error }]}>
                          Emergency
                        </Text>
                      </View>
                    )}
                    
                    {job.mechanicId && (
                      <View style={styles.metaRow}>
                        <Icons.User size={14} color={Colors.mechanic} />
                        <Text style={styles.metaText}>
                          Assigned to {job.mechanicId === 'mechanic-cody' ? 'Cody Owner' : job.mechanicId}
                        </Text>
                      </View>
                    )}

                    {timeline.length > 0 && (
                      <View style={styles.metaRow}>
                        <Icons.Activity size={14} color={Colors.secondary} />
                        <Text style={styles.metaText}>
                          {timeline.length} status update{timeline.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Job Photos Section */}
                  {jobPhotos.length > 0 && (
                    <View style={styles.photosSection}>
                      <View style={styles.photosSectionHeader}>
                        <Icons.Camera size={16} color={Colors.primary} />
                        <Text style={styles.photosSectionTitle}>
                          Job Photos ({jobPhotos.length})
                        </Text>
                        <TouchableOpacity
                          style={styles.viewAllPhotosButton}
                          onPress={() => setSelectedJobPhotos(jobPhotos)}
                        >
                          <Text style={styles.viewAllPhotosText}>View All</Text>
                        </TouchableOpacity>
                      </View>
                      
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosPreview}>
                        {jobPhotos.slice(0, 4).map((photo) => {
                          const IconComponent = Icons[getTypeIcon(photo.type) as keyof typeof Icons] as any;
                          
                          return (
                            <TouchableOpacity
                              key={photo.id}
                              style={styles.photoPreviewItem}
                              onPress={() => setSelectedPhoto(photo)}
                            >
                              <Image source={{ uri: photo.url }} style={styles.photoPreview} />
                              <View style={[styles.photoTypeBadge, { backgroundColor: getTypeColor(photo.type) }]}>
                                <IconComponent size={10} color={Colors.white} />
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                        {jobPhotos.length > 4 && (
                          <TouchableOpacity
                            style={styles.morePhotosIndicator}
                            onPress={() => setSelectedJobPhotos(jobPhotos)}
                          >
                            <Text style={styles.morePhotosText}>+{jobPhotos.length - 4}</Text>
                          </TouchableOpacity>
                        )}
                      </ScrollView>
                    </View>
                  )}

                  {/* Signature Status */}
                  {job.signatureData && (
                    <View style={styles.signatureSection}>
                      <Icons.CheckCircle size={16} color={Colors.success} />
                      <Text style={styles.signatureText}>Customer signature captured</Text>
                      <Text style={styles.signatureDate}>
                        {job.signatureCapturedAt?.toLocaleDateString()}
                      </Text>
                    </View>
                  )}

                  {jobQuote && (
                    <View style={styles.quoteInfo}>
                      <View style={styles.quoteDivider} />
                      <View style={styles.quoteRow}>
                        <Text style={styles.quoteLabel}>Quote Amount:</Text>
                        <Text style={styles.quoteValue}>${jobQuote.totalCost}</Text>
                      </View>
                      <View style={styles.quoteRow}>
                        <Text style={styles.quoteLabel}>Quote Status:</Text>
                        <Text style={[
                          styles.quoteValue,
                          { color: getStatusColor(jobQuote.status) }
                        ]}>
                          {jobQuote.status}
                        </Text>
                      </View>
                      {jobQuote.paidAt && (
                        <View style={styles.quoteRow}>
                          <Text style={styles.quoteLabel}>Paid:</Text>
                          <Text style={[styles.quoteValue, { color: Colors.success }]}>
                            {jobQuote.paidAt.toLocaleDateString()}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Progress Indicators */}
                  {job.status === 'in_progress' || job.status === 'paused' || job.status === 'completed' ? (
                    <View style={styles.progressSection}>
                      <View style={styles.progressDivider} />
                      <Text style={styles.progressTitle}>Job Progress</Text>
                      <View style={styles.progressItems}>
                        <View style={styles.progressItem}>
                          <Icons.CheckCircle 
                            size={16} 
                            color={job.toolsCheckCompletedAt ? Colors.success : Colors.textMuted} 
                          />
                          <Text style={[
                            styles.progressText,
                            { color: job.toolsCheckCompletedAt ? Colors.success : Colors.textMuted }
                          ]}>
                            Tools Checked
                          </Text>
                        </View>
                        
                        <View style={styles.progressItem}>
                          <Icons.CheckCircle 
                            size={16} 
                            color={jobPhotos.length > 0 ? Colors.success : Colors.textMuted} 
                          />
                          <Text style={[
                            styles.progressText,
                            { color: jobPhotos.length > 0 ? Colors.success : Colors.textMuted }
                          ]}>
                            Photos Uploaded ({jobPhotos.length})
                          </Text>
                        </View>
                        
                        <View style={styles.progressItem}>
                          <Icons.CheckCircle 
                            size={16} 
                            color={job.signatureData ? Colors.success : Colors.textMuted} 
                          />
                          <Text style={[
                            styles.progressText,
                            { color: job.signatureData ? Colors.success : Colors.textMuted }
                          ]}>
                            Customer Signature
                          </Text>
                        </View>
                        
                        <View style={styles.progressItem}>
                          <Icons.CheckCircle 
                            size={16} 
                            color={job.status === 'completed' ? Colors.success : Colors.textMuted} 
                          />
                          <Text style={[
                            styles.progressText,
                            { color: job.status === 'completed' ? Colors.success : Colors.textMuted }
                          ]}>
                            Job Completed
                          </Text>
                        </View>
                      </View>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Job Photos Modal */}
      {selectedJobPhotos && (
        <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.photosModalContainer}>
            <View style={styles.photosModalHeader}>
              <Text style={styles.photosModalTitle}>Job Photos ({selectedJobPhotos.length})</Text>
              <TouchableOpacity onPress={() => setSelectedJobPhotos(null)}>
                <Icons.X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.photosModalContent}>
              {['before', 'during', 'after', 'parts', 'damage'].map(type => {
                const typePhotos = selectedJobPhotos.filter(p => p.type === type);
                if (typePhotos.length === 0) return null;
                
                const IconComponent = Icons[getTypeIcon(type as JobPhoto['type']) as keyof typeof Icons] as any;
                
                return (
                  <View key={type} style={styles.photoTypeGroup}>
                    <View style={styles.photoTypeHeader}>
                      <IconComponent size={16} color={getTypeColor(type as JobPhoto['type'])} />
                      <Text style={styles.photoTypeTitle}>
                        {type.charAt(0).toUpperCase() + type.slice(1)} Photos ({typePhotos.length})
                      </Text>
                    </View>
                    
                    <View style={styles.photoGrid}>
                      {typePhotos.map((photo) => (
                        <TouchableOpacity
                          key={photo.id}
                          style={styles.photoGridItem}
                          onPress={() => setSelectedPhoto(photo)}
                        >
                          <Image source={{ uri: photo.url }} style={styles.photoGridImage} />
                          <Text style={styles.photoDate}>
                            {photo.uploadedAt.toLocaleDateString()}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </Modal>
      )}

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <Modal visible={true} animationType="fade" presentationStyle="fullScreen">
          <View style={styles.photoViewerContainer}>
            <View style={styles.photoViewerHeader}>
              <TouchableOpacity onPress={() => setSelectedPhoto(null)}>
                <Icons.X size={24} color={Colors.white} />
              </TouchableOpacity>
              <Text style={styles.photoViewerTitle}>
                {selectedPhoto.type.charAt(0).toUpperCase() + selectedPhoto.type.slice(1)} Photo
              </Text>
              <View style={{ width: 24 }} />
            </View>
            <View style={styles.photoViewerContent}>
              <Image source={{ uri: selectedPhoto.url }} style={styles.photoViewerImage} />
            </View>
            <View style={styles.photoViewerFooter}>
              <Text style={styles.photoViewerDate}>
                Uploaded: {selectedPhoto.uploadedAt.toLocaleDateString()} at {selectedPhoto.uploadedAt.toLocaleTimeString()}
              </Text>
              <Text style={styles.photoViewerUploader}>
                By: {selectedPhoto.uploadedBy === 'mechanic-cody' ? 'Cody Owner' : selectedPhoto.uploadedBy}
              </Text>
            </View>
          </View>
        </Modal>
      )}
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
  jobsList: {
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
  jobCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobTitle: {
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
  jobDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  jobMeta: {
    gap: 6,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  photosSection: {
    marginBottom: 12,
  },
  photosSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  photosSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  viewAllPhotosButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.primary + '20',
    borderRadius: 4,
  },
  viewAllPhotosText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  photosPreview: {
    flexDirection: 'row',
  },
  photoPreviewItem: {
    position: 'relative',
    marginRight: 8,
  },
  photoPreview: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: Colors.surface,
  },
  photoTypeBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    borderRadius: 6,
    padding: 2,
  },
  morePhotosIndicator: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  morePhotosText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  signatureSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.success + '10',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  signatureText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
    flex: 1,
  },
  signatureDate: {
    fontSize: 10,
    color: Colors.success,
  },
  quoteInfo: {
    marginTop: 8,
  },
  quoteDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 8,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  quoteLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  quoteValue: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  progressSection: {
    marginTop: 8,
  },
  progressDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  progressItems: {
    gap: 6,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '500',
  },
  photosModalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  photosModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  photosModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  photosModalContent: {
    flex: 1,
    padding: 20,
  },
  photoTypeGroup: {
    marginBottom: 24,
  },
  photoTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  photoTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoGridItem: {
    width: '48%',
  },
  photoGridImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    marginBottom: 4,
  },
  photoDate: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  photoViewerContainer: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  photoViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  photoViewerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  photoViewerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoViewerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  photoViewerFooter: {
    padding: 20,
    alignItems: 'center',
  },
  photoViewerDate: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.8,
    marginBottom: 4,
  },
  photoViewerUploader: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.6,
  },
});