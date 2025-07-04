import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { Colors } from '@/constants/colors';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import { SERVICE_CATEGORIES, SERVICE_TOOLS } from '@/constants/services';
import { ServiceRequest, ServiceStatus, JobPhoto } from '@/types/service';
import { ChatComponent } from '@/components/ChatComponent';
import { WorkTimer } from '@/components/WorkTimer';
import { SignatureCapture } from '@/components/SignatureCapture';
import { PaymentModal } from '@/components/PaymentModal';
import { JobPhotoUpload } from '@/components/JobPhotoUpload';
import { JobTimeline } from '@/components/JobTimeline';
import * as Icons from 'lucide-react-native';

export default function MechanicJobsScreen() {
  const { 
    serviceRequests, 
    quotes,
    updateServiceRequest, 
    updateJobStatus,
    addJobLog, 
    getJobLogs, 
    getActiveJobTimer,
    updateJobTools,
    completeToolsCheck,
    getJobToolsStatus,
    logEvent,
    cancelJob,
    addJobParts,
    updateJobParts,
    getJobParts,
    addJobPhotos,
    getJobPhotos,
    getJobTimeline,
    getJobDuration
  } = useAppStore();
  const { user } = useAuthStore();
  const [selectedTab, setSelectedTab] = useState<'pending' | 'active' | 'completed'>('pending');
  const [selectedRequestForChat, setSelectedRequestForChat] = useState<string | null>(null);
  const [selectedRequestForTimer, setSelectedRequestForTimer] = useState<string | null>(null);
  const [selectedRequestForSignature, setSelectedRequestForSignature] = useState<string | null>(null);
  const [selectedRequestForTools, setSelectedRequestForTools] = useState<string | null>(null);
  const [selectedRequestForParts, setSelectedRequestForParts] = useState<string | null>(null);
  const [selectedRequestForPhotos, setSelectedRequestForPhotos] = useState<string | null>(null);
  const [selectedRequestForTimeline, setSelectedRequestForTimeline] = useState<string | null>(null);
  const [selectedRequestForPayment, setSelectedRequestForPayment] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null);

  // Production: Filter jobs for Cody only
  const mechanicId = 'mechanic-cody';
  const mechanicJobs = serviceRequests.filter(job => {
    // In production, only show jobs assigned to Cody or unassigned jobs
    return !job.mechanicId || job.mechanicId === mechanicId;
  });

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

  const filteredJobs = mechanicJobs.filter(job => {
    switch (selectedTab) {
      case 'pending':
        return job.status === 'pending' || job.status === 'quoted';
      case 'active':
        return job.status === 'accepted' || job.status === 'scheduled' || job.status === 'in_progress' || job.status === 'paused';
      case 'completed':
        return job.status === 'completed' || job.status === 'cancelled';
      default:
        return false;
    }
  });

  const handleClaimJob = (jobId: string) => {
    Alert.alert(
      'Claim Job',
      'Do you want to claim this job?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Claim',
          onPress: () => {
            logEvent('job_claimed', { jobId, mechanicId });
            
            // Set up required tools for this job
            const job = serviceRequests.find(j => j.id === jobId);
            if (job) {
              const serviceCategory = SERVICE_CATEGORIES.find(s => s.id === job.type);
              const requiredTools = serviceCategory?.requiredTools.map(tool => tool.id) || [];
              
              updateJobStatus(jobId, 'accepted', mechanicId, 'Job claimed by mechanic');
              updateServiceRequest(jobId, { 
                mechanicId: mechanicId,
                requiredTools
              });
            }
            
            Alert.alert('Job Claimed', 'You have successfully claimed this job. Check your tools before starting work.');
          }
        }
      ]
    );
  };

  const handleStatusUpdate = (jobId: string, newStatus: ServiceStatus, notes?: string) => {
    const statusLabels: Record<ServiceStatus, string> = {
      'pending': 'Set Pending',
      'quoted': 'Set Quoted',
      'accepted': 'Accept Job',
      'scheduled': 'Schedule Job',
      'in_progress': 'Start Work',
      'paused': 'Pause Work',
      'completed': 'Complete Job',
      'cancelled': 'Cancel Job'
    };

    const statusLabel = statusLabels[newStatus] || `Update to ${newStatus}`;

    Alert.alert(
      statusLabel,
      `Are you sure you want to ${statusLabel.toLowerCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            updateJobStatus(jobId, newStatus, mechanicId, notes);
            
            if (newStatus === 'completed') {
              // Trigger payment flow
              setSelectedRequestForPayment(jobId);
            }
          }
        }
      ]
    );
  };

  const handleCompleteJob = (jobId: string) => {
    const jobLogs = getJobLogs(jobId);
    const activeTimer = getActiveJobTimer(jobId);
    const job = serviceRequests.find(j => j.id === jobId);
    const jobPhotos = getJobPhotos(jobId);
    
    // Check if there are work logs
    if (jobLogs.length === 0) {
      Alert.alert(
        'Work Timer Required',
        'Please log work time using the timer before completing this job.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Check if timer is still running
    if (activeTimer) {
      Alert.alert(
        'Timer Still Running',
        'Please stop the work timer before completing this job.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Check if signature is required and present
    if (!job?.signatureData) {
      Alert.alert(
        'Signature Required',
        'Customer signature is required to complete this job.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Get Signature', onPress: () => setSelectedRequestForSignature(jobId) }
        ]
      );
      return;
    }

    // Check if tools check is completed
    if (!job?.toolsCheckCompletedAt) {
      Alert.alert(
        'Tools Check Required',
        'Please complete the tools check before finishing this job.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Check Tools', onPress: () => setSelectedRequestForTools(jobId) }
        ]
      );
      return;
    }

    // Check if after photos are uploaded
    const afterPhotos = jobPhotos.filter(p => p.type === 'after');
    if (afterPhotos.length === 0) {
      Alert.alert(
        'After Photos Required',
        'Please upload at least one "after" photo showing the completed work.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Photos', onPress: () => setSelectedRequestForPhotos(jobId) }
        ]
      );
      return;
    }

    // All requirements met, complete the job and trigger payment
    handleStatusUpdate(jobId, 'completed', 'Job completed with all requirements met');
  };

  const handleCancelJob = (jobId: string, reason: string) => {
    logEvent('job_cancelled', { jobId, mechanicId, reason });
    
    cancelJob(jobId, reason, mechanicId);
    setShowCancelModal(null);
    
    Alert.alert('Job Cancelled', 'Job has been cancelled and customer will be notified.');
  };

  const handleWorkComplete = (jobId: string, workLog: any) => {
    logEvent('work_timer_stopped', { 
      jobId, 
      mechanicId, 
      duration: workLog.endTime ? (workLog.endTime.getTime() - workLog.startTime.getTime()) / (1000 * 60) : 0
    });
    
    addJobLog(workLog);
    setSelectedRequestForTimer(null);
    
    Alert.alert('Work Logged', 'Work time has been logged successfully.');
  };

  const handleSignatureComplete = (jobId: string, signatureData: string) => {
    logEvent('signature_captured', { jobId, mechanicId });
    
    updateServiceRequest(jobId, { 
      signatureData,
      signatureCapturedAt: new Date(),
      signatureCapturedBy: mechanicId
    });
    setSelectedRequestForSignature(null);
    
    Alert.alert('Signature Captured', 'Customer signature has been captured.');
  };

  const handlePhotosUpdate = (jobId: string, photos: JobPhoto[]) => {
    const job = serviceRequests.find(j => j.id === jobId);
    const currentPhotos = job?.jobPhotos || [];
    
    // Find new photos
    const newPhotos = photos.filter(p => !currentPhotos.find(cp => cp.id === p.id));
    
    if (newPhotos.length > 0) {
      addJobPhotos(jobId, newPhotos);
    }
    
    // Update the service request with all photos
    updateServiceRequest(jobId, { jobPhotos: photos });
  };

  const handlePaymentComplete = () => {
    setSelectedRequestForPayment(null);
    Alert.alert('Payment Complete', 'Job has been completed and payment processed successfully.');
  };

  const openChat = (requestId: string) => {
    logEvent('chat_opened', { jobId: requestId, mechanicId });
    setSelectedRequestForChat(requestId);
  };

  const openTimer = (requestId: string) => {
    logEvent('work_timer_opened', { jobId: requestId, mechanicId });
    setSelectedRequestForTimer(requestId);
  };

  const openToolsCheck = (requestId: string) => {
    logEvent('tools_check_opened', { jobId: requestId, mechanicId });
    setSelectedRequestForTools(requestId);
  };

  const openPartsManager = (requestId: string) => {
    logEvent('parts_manager_opened', { jobId: requestId, mechanicId });
    setSelectedRequestForParts(requestId);
  };

  const openPhotosManager = (requestId: string) => {
    logEvent('photos_manager_opened', { jobId: requestId, mechanicId });
    setSelectedRequestForPhotos(requestId);
  };

  const openTimeline = (requestId: string) => {
    logEvent('timeline_opened', { jobId: requestId, mechanicId });
    setSelectedRequestForTimeline(requestId);
  };

  // Chat View
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
          <Text style={styles.chatHeaderTitle}>Customer Chat</Text>
        </View>
        <ChatComponent
          serviceRequestId={selectedRequestForChat}
          currentUserId={mechanicId}
          currentUserName="Cody Owner"
          currentUserType="mechanic"
        />
      </View>
    );
  }

  // Work Timer View
  if (selectedRequestForTimer) {
    const job = serviceRequests.find(j => j.id === selectedRequestForTimer);
    return (
      <View style={styles.container}>
        <View style={styles.timerHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedRequestForTimer(null)}
          >
            <Icons.ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.timerHeaderTitle}>Work Timer</Text>
        </View>
        <WorkTimer
          jobId={selectedRequestForTimer}
          jobTitle={job ? getServiceTitle(job.type) : 'Service'}
          onWorkComplete={handleWorkComplete}
        />
      </View>
    );
  }

  // Signature Capture View
  if (selectedRequestForSignature) {
    const job = serviceRequests.find(j => j.id === selectedRequestForSignature);
    return (
      <View style={styles.container}>
        <View style={styles.signatureHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedRequestForSignature(null)}
          >
            <Icons.ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.signatureHeaderTitle}>Customer Signature</Text>
        </View>
        <SignatureCapture
          jobId={selectedRequestForSignature}
          jobTitle={job ? getServiceTitle(job.type) : 'Service'}
          onSignatureComplete={handleSignatureComplete}
          onCancel={() => setSelectedRequestForSignature(null)}
        />
      </View>
    );
  }

  // Photos Manager View
  if (selectedRequestForPhotos) {
    const job = serviceRequests.find(j => j.id === selectedRequestForPhotos);
    const jobPhotos = getJobPhotos(selectedRequestForPhotos);
    
    return (
      <View style={styles.container}>
        <View style={styles.photosHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedRequestForPhotos(null)}
          >
            <Icons.ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.photosHeaderTitle}>Job Photos</Text>
        </View>
        
        <ScrollView style={styles.photosContent}>
          <JobPhotoUpload
            jobId={selectedRequestForPhotos}
            photos={jobPhotos}
            onPhotosChange={(photos) => handlePhotosUpdate(selectedRequestForPhotos, photos)}
            maxPhotos={15}
            allowedTypes={['before', 'during', 'after', 'parts', 'damage']}
          />
        </ScrollView>
      </View>
    );
  }

  // Timeline View
  if (selectedRequestForTimeline) {
    const job = serviceRequests.find(j => j.id === selectedRequestForTimeline);
    const timeline = getJobTimeline(selectedRequestForTimeline);
    const duration = getJobDuration(selectedRequestForTimeline);
    
    return (
      <View style={styles.container}>
        <View style={styles.timelineHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedRequestForTimeline(null)}
          >
            <Icons.ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.timelineHeaderTitle}>Job Timeline</Text>
        </View>
        
        <ScrollView style={styles.timelineContent}>
          <View style={styles.timelineJobInfo}>
            <Text style={styles.timelineJobTitle}>
              {job ? getServiceTitle(job.type) : 'Service'}
            </Text>
            <Text style={styles.timelineJobDescription}>
              {job?.description}
            </Text>
          </View>
          
          <JobTimeline
            timeline={timeline}
            currentStatus={job?.status || 'pending'}
            estimatedDuration={duration.estimated}
            actualDuration={duration.actual}
          />
        </ScrollView>
      </View>
    );
  }

  // Tools Check View
  if (selectedRequestForTools) {
    const job = serviceRequests.find(j => j.id === selectedRequestForTools);
    const serviceCategory = SERVICE_CATEGORIES.find(s => s.id === job?.type);
    const requiredTools = serviceCategory?.requiredTools || [];
    
    return (
      <View style={styles.container}>
        <View style={styles.toolsHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedRequestForTools(null)}
          >
            <Icons.ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.toolsHeaderTitle}>Tools Check</Text>
        </View>
        
        <ScrollView style={styles.toolsContent}>
          <View style={styles.toolsSection}>
            <Text style={styles.toolsSectionTitle}>
              Required Tools for {getServiceTitle(job?.type || '')}
            </Text>
            
            {requiredTools.map((tool) => (
              <TouchableOpacity
                key={tool.id}
                style={[
                  styles.toolItem,
                  job?.toolsChecked?.[tool.id] && styles.toolItemChecked
                ]}
                onPress={() => {
                  const currentChecked = job?.toolsChecked || {};
                  const newChecked = {
                    ...currentChecked,
                    [tool.id]: !currentChecked[tool.id]
                  };
                  updateJobTools(selectedRequestForTools, newChecked);
                }}
              >
                <View style={styles.toolItemLeft}>
                  <View style={[
                    styles.toolCheckbox,
                    job?.toolsChecked?.[tool.id] && styles.toolCheckboxChecked
                  ]}>
                    {job?.toolsChecked?.[tool.id] && (
                      <Icons.Check size={16} color={Colors.white} />
                    )}
                  </View>
                  <View style={styles.toolInfo}>
                    <Text style={styles.toolName}>{tool.name}</Text>
                    {tool.description && (
                      <Text style={styles.toolDescription}>{tool.description}</Text>
                    )}
                  </View>
                </View>
                <View style={[
                  styles.toolBadge,
                  { backgroundColor: tool.required ? Colors.error + '20' : Colors.textMuted + '20' }
                ]}>
                  <Text style={[
                    styles.toolBadgeText,
                    { color: tool.required ? Colors.error : Colors.textMuted }
                  ]}>
                    {tool.required ? 'Required' : 'Optional'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity
            style={[
              styles.completeToolsButton,
              !requiredTools.every(tool => tool.required ? job?.toolsChecked?.[tool.id] : true) && styles.disabledButton
            ]}
            onPress={() => {
              const allRequiredChecked = requiredTools.every(tool => 
                tool.required ? job?.toolsChecked?.[tool.id] : true
              );
              
              if (!allRequiredChecked) {
                Alert.alert('Missing Tools', 'Please check all required tools before proceeding.');
                return;
              }
              
              completeToolsCheck(selectedRequestForTools);
              setSelectedRequestForTools(null);
              Alert.alert('Tools Check Complete', 'All required tools have been verified.');
            }}
            disabled={!requiredTools.every(tool => tool.required ? job?.toolsChecked?.[tool.id] : true)}
          >
            <Text style={[
              styles.completeToolsButtonText,
              !requiredTools.every(tool => tool.required ? job?.toolsChecked?.[tool.id] : true) && styles.disabledButtonText
            ]}>
              Complete Tools Check
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Parts Manager View
  if (selectedRequestForParts) {
    const job = serviceRequests.find(j => j.id === selectedRequestForParts);
    const jobParts = getJobParts(selectedRequestForParts);
    
    return (
      <View style={styles.container}>
        <View style={styles.partsHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedRequestForParts(null)}
          >
            <Icons.ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.partsHeaderTitle}>Parts Manager</Text>
        </View>
        
        <ScrollView style={styles.partsContent}>
          <View style={styles.partsSection}>
            <Text style={styles.partsSectionTitle}>
              Parts for {getServiceTitle(job?.type || '')}
            </Text>
            
            {jobParts.length === 0 ? (
              <View style={styles.noPartsCard}>
                <Icons.Package size={48} color={Colors.textMuted} />
                <Text style={styles.noPartsText}>No parts added yet</Text>
                <Text style={styles.noPartsSubtext}>Add parts needed for this job</Text>
              </View>
            ) : (
              <View style={styles.partsList}>
                {jobParts.map((part, index) => (
                  <View key={index} style={styles.partItem}>
                    <View style={styles.partInfo}>
                      <Text style={styles.partName}>{part.name}</Text>
                      <Text style={styles.partDescription}>{part.description}</Text>
                      <Text style={styles.partPrice}>${part.price} x {part.quantity}</Text>
                    </View>
                    <View style={styles.partActions}>
                      <Text style={styles.partTotal}>${(part.price * part.quantity).toFixed(2)}</Text>
                      <TouchableOpacity
                        style={styles.removePartButton}
                        onPress={() => {
                          const updatedParts = jobParts.filter((_, i) => i !== index);
                          updateJobParts(selectedRequestForParts, updatedParts);
                        }}
                      >
                        <Icons.Trash2 size={16} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
            
            <TouchableOpacity
              style={styles.addPartButton}
              onPress={() => {
                // Mock adding a part - in production this would be a form
                const newPart = {
                  name: 'Oil Filter',
                  description: 'Standard oil filter replacement',
                  price: 15.99,
                  quantity: 1,
                  source: 'AutoZone'
                };
                addJobParts(selectedRequestForParts, [newPart]);
                Alert.alert('Part Added', 'Oil filter has been added to this job.');
              }}
            >
              <Icons.Plus size={20} color={Colors.primary} />
              <Text style={styles.addPartButtonText}>Add Part</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Mechanic Info Header */}
      <View style={styles.mechanicHeader}>
        <Text style={styles.mechanicName}>
          Cody Owner - Mobile Mechanic
        </Text>
        <Text style={styles.mechanicSubtext}>
          Production Environment - Cody Only Access
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'pending', label: 'Pending', count: mechanicJobs.filter(j => j.status === 'pending' || j.status === 'quoted').length },
          { key: 'active', label: 'Active', count: mechanicJobs.filter(j => ['accepted', 'scheduled', 'in_progress', 'paused'].includes(j.status)).length },
          { key: 'completed', label: 'Completed', count: mechanicJobs.filter(j => j.status === 'completed' || j.status === 'cancelled').length },
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

      {/* Jobs List */}
      <ScrollView style={styles.jobsList} showsVerticalScrollIndicator={false}>
        {filteredJobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icons.Briefcase size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No {selectedTab} jobs</Text>
            <Text style={styles.emptyText}>
              {selectedTab === 'pending' && 'New job requests will appear here'}
              {selectedTab === 'active' && 'Jobs you are working on will appear here'}
              {selectedTab === 'completed' && 'Completed jobs will appear here'}
            </Text>
          </View>
        ) : (
          <View style={styles.content}>
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onClaimJob={handleClaimJob}
                onCompleteJob={handleCompleteJob}
                onStatusUpdate={handleStatusUpdate}
                onCancelJob={() => setShowCancelModal(job.id)}
                onOpenChat={openChat}
                onOpenTimer={openTimer}
                onOpenToolsCheck={openToolsCheck}
                onOpenPartsManager={openPartsManager}
                onOpenPhotosManager={openPhotosManager}
                onOpenTimeline={openTimeline}
                getServiceTitle={getServiceTitle}
                getStatusColor={getStatusColor}
                getJobLogs={getJobLogs}
                getActiveJobTimer={getActiveJobTimer}
                getJobToolsStatus={getJobToolsStatus}
                getJobParts={getJobParts}
                getJobPhotos={getJobPhotos}
                getJobTimeline={getJobTimeline}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Cancel Job Modal */}
      {showCancelModal && (
        <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
          <CancelJobModal
            jobId={showCancelModal}
            onCancel={() => setShowCancelModal(null)}
            onConfirm={handleCancelJob}
          />
        </Modal>
      )}

      {/* Payment Modal */}
      {selectedRequestForPayment && (
        <PaymentModal
          quote={quotes.find(q => q.serviceRequestId === selectedRequestForPayment)!}
          paymentType="full"
          onSuccess={handlePaymentComplete}
          onCancel={() => setSelectedRequestForPayment(null)}
        />
      )}
    </View>
  );
}

interface JobCardProps {
  job: ServiceRequest;
  onClaimJob: (jobId: string) => void;
  onCompleteJob: (jobId: string) => void;
  onStatusUpdate: (jobId: string, status: ServiceStatus, notes?: string) => void;
  onCancelJob: (jobId: string) => void;
  onOpenChat: (jobId: string) => void;
  onOpenTimer: (jobId: string) => void;
  onOpenToolsCheck: (jobId: string) => void;
  onOpenPartsManager: (jobId: string) => void;
  onOpenPhotosManager: (jobId: string) => void;
  onOpenTimeline: (jobId: string) => void;
  getServiceTitle: (type: string) => string;
  getStatusColor: (status: string) => string;
  getJobLogs: (jobId: string) => any[];
  getActiveJobTimer: (jobId: string) => any;
  getJobToolsStatus: (jobId: string) => { total: number; checked: number; allRequired: boolean };
  getJobParts: (jobId: string) => any[];
  getJobPhotos: (jobId: string) => JobPhoto[];
  getJobTimeline: (jobId: string) => any[];
}

function JobCard({ 
  job, 
  onClaimJob, 
  onCompleteJob, 
  onStatusUpdate,
  onCancelJob,
  onOpenChat, 
  onOpenTimer, 
  onOpenToolsCheck,
  onOpenPartsManager,
  onOpenPhotosManager,
  onOpenTimeline,
  getServiceTitle, 
  getStatusColor,
  getJobLogs,
  getActiveJobTimer,
  getJobToolsStatus,
  getJobParts,
  getJobPhotos,
  getJobTimeline
}: JobCardProps) {
  const jobLogs = getJobLogs(job.id);
  const activeTimer = getActiveJobTimer(job.id);
  const toolsStatus = getJobToolsStatus(job.id);
  const jobParts = getJobParts(job.id);
  const jobPhotos = getJobPhotos(job.id);
  const timeline = getJobTimeline(job.id);
  
  const hasWorkLogs = jobLogs.length > 0;
  const hasSignature = !!job.signatureData;
  const hasToolsCheck = !!job.toolsCheckCompletedAt;
  const afterPhotos = jobPhotos.filter(p => p.type === 'after');
  const hasAfterPhotos = afterPhotos.length > 0;
  const canComplete = hasWorkLogs && hasSignature && hasToolsCheck && hasAfterPhotos && !activeTimer;

  const getNextStatus = (): ServiceStatus | null => {
    switch (job.status) {
      case 'accepted': return 'scheduled';
      case 'scheduled': return 'in_progress';
      case 'in_progress': return 'paused';
      case 'paused': return 'in_progress';
      default: return null;
    }
  };

  const getNextStatusLabel = () => {
    switch (job.status) {
      case 'accepted': return 'Schedule';
      case 'scheduled': return 'Start Work';
      case 'in_progress': return 'Pause';
      case 'paused': return 'Resume';
      default: return 'Update';
    }
  };

  const nextStatus = getNextStatus();

  return (
    <View style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <View style={styles.jobTitleRow}>
          <Text style={styles.jobTitle}>{getServiceTitle(job.type)}</Text>
          {job.urgency === 'emergency' && (
            <Icons.AlertTriangle size={16} color={Colors.error} />
          )}
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(job.status) }]}>
            {job.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      <Text style={styles.jobDescription} numberOfLines={3}>
        {job.description}
      </Text>

      {/* AI Diagnosis Preview */}
      {job.aiDiagnosis && (
        <View style={styles.aiDiagnosisPreview}>
          <Icons.Brain size={14} color={Colors.primary} />
          <Text style={styles.aiDiagnosisText}>
            AI suggests: {job.aiDiagnosis.likelyCauses[0]}
          </Text>
        </View>
      )}

      {/* Job Progress Indicators */}
      {(job.status === 'accepted' || job.status === 'scheduled' || job.status === 'in_progress' || job.status === 'paused' || job.status === 'completed') && (
        <View style={styles.progressSection}>
          <Text style={styles.progressTitle}>Job Progress</Text>
          <View style={styles.progressIndicators}>
            <View style={styles.progressItem}>
              <View style={[
                styles.progressIcon,
                { backgroundColor: hasToolsCheck ? Colors.success + '20' : Colors.textMuted + '20' }
              ]}>
                {hasToolsCheck ? (
                  <Icons.CheckCircle size={16} color={Colors.success} />
                ) : (
                  <Icons.Wrench size={16} color={Colors.textMuted} />
                )}
              </View>
              <Text style={[
                styles.progressText,
                { color: hasToolsCheck ? Colors.success : Colors.textMuted }
              ]}>
                Tools ({toolsStatus.checked}/{toolsStatus.total})
              </Text>
            </View>

            <View style={styles.progressItem}>
              <View style={[
                styles.progressIcon,
                { backgroundColor: jobParts.length > 0 ? Colors.success + '20' : Colors.textMuted + '20' }
              ]}>
                {jobParts.length > 0 ? (
                  <Icons.CheckCircle size={16} color={Colors.success} />
                ) : (
                  <Icons.Package size={16} color={Colors.textMuted} />
                )}
              </View>
              <Text style={[
                styles.progressText,
                { color: jobParts.length > 0 ? Colors.success : Colors.textMuted }
              ]}>
                Parts ({jobParts.length})
              </Text>
            </View>

            <View style={styles.progressItem}>
              <View style={[
                styles.progressIcon,
                { backgroundColor: hasAfterPhotos ? Colors.success + '20' : Colors.textMuted + '20' }
              ]}>
                {hasAfterPhotos ? (
                  <Icons.CheckCircle size={16} color={Colors.success} />
                ) : (
                  <Icons.Camera size={16} color={Colors.textMuted} />
                )}
              </View>
              <Text style={[
                styles.progressText,
                { color: hasAfterPhotos ? Colors.success : Colors.textMuted }
              ]}>
                Photos ({jobPhotos.length})
              </Text>
            </View>

            <View style={styles.progressItem}>
              <View style={[
                styles.progressIcon,
                { backgroundColor: hasWorkLogs ? Colors.success + '20' : Colors.textMuted + '20' }
              ]}>
                {hasWorkLogs ? (
                  <Icons.CheckCircle size={16} color={Colors.success} />
                ) : (
                  <Icons.Clock size={16} color={Colors.textMuted} />
                )}
              </View>
              <Text style={[
                styles.progressText,
                { color: hasWorkLogs ? Colors.success : Colors.textMuted }
              ]}>
                Work Logged
              </Text>
              {activeTimer && (
                <View style={styles.activeIndicator}>
                  <Text style={styles.activeText}>ACTIVE</Text>
                </View>
              )}
            </View>

            <View style={styles.progressItem}>
              <View style={[
                styles.progressIcon,
                { backgroundColor: hasSignature ? Colors.success + '20' : Colors.textMuted + '20' }
              ]}>
                {hasSignature ? (
                  <Icons.CheckCircle size={16} color={Colors.success} />
                ) : (
                  <Icons.PenTool size={16} color={Colors.textMuted} />
                )}
              </View>
              <Text style={[
                styles.progressText,
                { color: hasSignature ? Colors.success : Colors.textMuted }
              ]}>
                Signature
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Job Details */}
      <View style={styles.jobDetails}>
        <View style={styles.detailRow}>
          <Icons.Calendar size={14} color={Colors.textMuted} />
          <Text style={styles.detailText}>
            {new Date(job.createdAt).toLocaleDateString()}
          </Text>
        </View>
        
        {job.location && (
          <View style={styles.detailRow}>
            <Icons.MapPin size={14} color={Colors.textMuted} />
            <Text style={styles.detailText}>
              {job.location.address || 'Location provided'}
            </Text>
          </View>
        )}
        
        <View style={styles.detailRow}>
          <Icons.Clock size={14} color={Colors.textMuted} />
          <Text style={styles.detailText}>
            Urgency: {job.urgency}
          </Text>
        </View>

        {/* Timeline Summary */}
        {timeline.length > 0 && (
          <View style={styles.detailRow}>
            <Icons.Activity size={14} color={Colors.mechanic} />
            <Text style={styles.detailText}>
              {timeline.length} status update{timeline.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Work Time Summary */}
        {hasWorkLogs && (
          <View style={styles.detailRow}>
            <Icons.Timer size={14} color={Colors.mechanic} />
            <Text style={styles.detailText}>
              Total time: {Math.round(jobLogs.reduce((total, log) => {
                if (log.endTime) {
                  return total + (log.endTime.getTime() - log.startTime.getTime()) / (1000 * 60);
                }
                return total;
              }, 0))} minutes
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.jobActions}>
        <TouchableOpacity 
          style={styles.chatButton}
          onPress={() => onOpenChat(job.id)}
        >
          <Icons.MessageCircle size={16} color={Colors.primary} />
          <Text style={styles.chatButtonText}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.timelineButton}
          onPress={() => onOpenTimeline(job.id)}
        >
          <Icons.Activity size={16} color={Colors.secondary} />
          <Text style={styles.timelineButtonText}>Timeline</Text>
        </TouchableOpacity>

        {job.status === 'pending' || job.status === 'quoted' ? (
          <>
            <TouchableOpacity 
              style={styles.claimButton}
              onPress={() => onClaimJob(job.id)}
            >
              <Text style={styles.claimButtonText}>Claim Job</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => onCancelJob(job.id)}
            >
              <Icons.X size={16} color={Colors.error} />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : job.status === 'accepted' || job.status === 'scheduled' || job.status === 'in_progress' || job.status === 'paused' ? (
          <>
            {!hasToolsCheck && (
              <TouchableOpacity 
                style={styles.toolsButton}
                onPress={() => onOpenToolsCheck(job.id)}
              >
                <Icons.Wrench size={16} color={Colors.mechanic} />
                <Text style={styles.toolsButtonText}>Tools</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.partsButton}
              onPress={() => onOpenPartsManager(job.id)}
            >
              <Icons.Package size={16} color={Colors.secondary} />
              <Text style={styles.partsButtonText}>Parts</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.photosButton}
              onPress={() => onOpenPhotosManager(job.id)}
            >
              <Icons.Camera size={16} color={Colors.primary} />
              <Text style={styles.photosButtonText}>Photos</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.timerButton,
                activeTimer && styles.activeTimerButton
              ]}
              onPress={() => onOpenTimer(job.id)}
            >
              <Icons.Timer size={16} color={activeTimer ? Colors.white : Colors.mechanic} />
              <Text style={[
                styles.timerButtonText,
                activeTimer && styles.activeTimerButtonText
              ]}>
                {activeTimer ? 'Timer Active' : 'Timer'}
              </Text>
            </TouchableOpacity>

            {nextStatus && (
              <TouchableOpacity 
                style={styles.statusButton}
                onPress={() => onStatusUpdate(job.id, nextStatus)}
              >
                <Text style={styles.statusButtonText}>{getNextStatusLabel()}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.completeButton,
                !canComplete && styles.disabledButton
              ]}
              onPress={() => onCompleteJob(job.id)}
              disabled={!canComplete}
            >
              <Text style={[
                styles.completeButtonText,
                !canComplete && styles.disabledButtonText
              ]}>
                Complete
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => onCancelJob(job.id)}
            >
              <Icons.X size={16} color={Colors.error} />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>

      {/* Completion Requirements */}
      {(job.status === 'accepted' || job.status === 'scheduled' || job.status === 'in_progress' || job.status === 'paused') && !canComplete && (
        <View style={styles.requirementsSection}>
          <Text style={styles.requirementsTitle}>To complete this job:</Text>
          <View style={styles.requirements}>
            {!hasToolsCheck && (
              <Text style={styles.requirementText}>• Complete tools check</Text>
            )}
            {!hasWorkLogs && (
              <Text style={styles.requirementText}>• Log work time using timer</Text>
            )}
            {!hasAfterPhotos && (
              <Text style={styles.requirementText}>• Upload at least one "after" photo</Text>
            )}
            {!hasSignature && (
              <Text style={styles.requirementText}>• Get customer signature</Text>
            )}
            {activeTimer && (
              <Text style={styles.requirementText}>• Stop active timer</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

function CancelJobModal({ jobId, onCancel, onConfirm }: { 
  jobId: string; 
  onCancel: () => void; 
  onConfirm: (jobId: string, reason: string) => void; 
}) {
  const [reason, setReason] = useState('');
  const [selectedReason, setSelectedReason] = useState('');

  const cancelReasons = [
    'Customer requested cancellation',
    'Unable to complete due to parts availability',
    'Safety concerns',
    'Weather conditions',
    'Emergency situation',
    'Other'
  ];

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Cancel Job</Text>
        <TouchableOpacity onPress={onCancel}>
          <Icons.X size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.modalContent}>
        <Text style={styles.modalSubtitle}>
          Please select a reason for cancelling this job:
        </Text>
        
        {cancelReasons.map((reasonOption) => (
          <TouchableOpacity
            key={reasonOption}
            style={[
              styles.reasonOption,
              selectedReason === reasonOption && styles.selectedReasonOption
            ]}
            onPress={() => setSelectedReason(reasonOption)}
          >
            <View style={[
              styles.radioButton,
              selectedReason === reasonOption && styles.selectedRadioButton
            ]}>
              {selectedReason === reasonOption && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
            <Text style={styles.reasonText}>{reasonOption}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.modalActions}>
        <TouchableOpacity style={styles.modalCancelButton} onPress={onCancel}>
          <Text style={styles.modalCancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.modalConfirmButton,
            !selectedReason && styles.disabledButton
          ]}
          onPress={() => onConfirm(jobId, selectedReason)}
          disabled={!selectedReason}
        >
          <Text style={[
            styles.modalConfirmText,
            !selectedReason && styles.disabledButtonText
          ]}>
            Confirm Cancellation
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mechanicHeader: {
    backgroundColor: Colors.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  mechanicName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  mechanicSubtext: {
    fontSize: 12,
    color: Colors.textMuted,
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
    borderBottomColor: Colors.mechanic,
  },
  tabText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.mechanic,
    fontWeight: '600',
  },
  jobsList: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
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
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  signatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  toolsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  partsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  photosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  timelineHeader: {
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
  timerHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  signatureHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  toolsHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  partsHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  photosHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  timelineHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  toolsContent: {
    flex: 1,
    padding: 16,
  },
  partsContent: {
    flex: 1,
    padding: 16,
  },
  photosContent: {
    flex: 1,
    padding: 16,
  },
  timelineContent: {
    flex: 1,
    padding: 16,
  },
  timelineJobInfo: {
    marginBottom: 16,
  },
  timelineJobTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  timelineJobDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  toolsSection: {
    marginBottom: 24,
  },
  partsSection: {
    marginBottom: 24,
  },
  toolsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  partsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  toolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toolItemChecked: {
    borderColor: Colors.success,
    backgroundColor: Colors.success + '10',
  },
  toolItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toolCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toolCheckboxChecked: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  toolInfo: {
    flex: 1,
  },
  toolName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  toolDescription: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  toolBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  toolBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  completeToolsButton: {
    backgroundColor: Colors.success,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeToolsButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  noPartsCard: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  noPartsText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  noPartsSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  partsList: {
    marginBottom: 16,
  },
  partItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  partInfo: {
    flex: 1,
  },
  partName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  partDescription: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  partPrice: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  partActions: {
    alignItems: 'flex-end',
  },
  partTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  removePartButton: {
    padding: 4,
  },
  addPartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '20',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  addPartButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  jobTitle: {
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
    textTransform: 'capitalize',
  },
  jobDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  aiDiagnosisPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary + '10',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  aiDiagnosisText: {
    flex: 1,
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  progressIndicators: {
    flexDirection: 'row',
    gap: 16,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressIcon: {
    padding: 4,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '500',
  },
  activeIndicator: {
    backgroundColor: Colors.mechanic,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: 4,
  },
  activeText: {
    fontSize: 8,
    color: Colors.white,
    fontWeight: '600',
  },
  jobDetails: {
    gap: 6,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  jobActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
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
  timelineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary + '20',
    borderWidth: 1,
    borderColor: Colors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  timelineButtonText: {
    color: Colors.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  toolsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.mechanic + '20',
    borderWidth: 1,
    borderColor: Colors.mechanic,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  toolsButtonText: {
    color: Colors.mechanic,
    fontSize: 12,
    fontWeight: '600',
  },
  partsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary + '20',
    borderWidth: 1,
    borderColor: Colors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  partsButtonText: {
    color: Colors.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  photosButton: {
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
  photosButtonText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.mechanic + '20',
    borderWidth: 1,
    borderColor: Colors.mechanic,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  activeTimerButton: {
    backgroundColor: Colors.mechanic,
    borderColor: Colors.mechanic,
  },
  timerButtonText: {
    color: Colors.mechanic,
    fontSize: 12,
    fontWeight: '600',
  },
  activeTimerButtonText: {
    color: Colors.white,
  },
  statusButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  statusButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  claimButton: {
    flex: 1,
    backgroundColor: Colors.mechanic,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  claimButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  completeButton: {
    flex: 1,
    backgroundColor: Colors.success,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  completeButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '20',
    borderWidth: 1,
    borderColor: Colors.error,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  cancelButtonText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: Colors.textMuted,
  },
  disabledButtonText: {
    color: Colors.white,
    opacity: 0.7,
  },
  requirementsSection: {
    marginTop: 12,
    padding: 8,
    backgroundColor: Colors.warning + '10',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  requirementsTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.warning,
    marginBottom: 4,
  },
  requirements: {
    gap: 2,
  },
  requirementText: {
    fontSize: 10,
    color: Colors.warning,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
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
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedReasonOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedRadioButton: {
    borderColor: Colors.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  reasonText: {
    fontSize: 16,
    color: Colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 2,
    backgroundColor: Colors.error,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});