import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '@/constants/colors';
import { StatusTimestamp, ServiceStatus } from '@/types/service';
import * as Icons from 'lucide-react-native';

interface JobTimelineProps {
  timeline: StatusTimestamp[];
  currentStatus: ServiceStatus;
  estimatedDuration?: number;
  actualDuration?: number;
}

export function JobTimeline({ timeline, currentStatus, estimatedDuration, actualDuration }: JobTimelineProps) {
  const getStatusIcon = (status: ServiceStatus) => {
    switch (status) {
      case 'pending': return 'Clock';
      case 'quoted': return 'FileText';
      case 'accepted': return 'CheckCircle';
      case 'scheduled': return 'Calendar';
      case 'in_progress': return 'Wrench';
      case 'paused': return 'Pause';
      case 'completed': return 'CheckCircle2';
      case 'cancelled': return 'X';
      default: return 'Circle';
    }
  };

  const getStatusColor = (status: ServiceStatus) => {
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

  const getStatusLabel = (status: ServiceStatus): string => {
    switch (status) {
      case 'pending': return 'Job Created';
      case 'quoted': return 'Quote Provided';
      case 'accepted': return 'Job Accepted';
      case 'scheduled': return 'Job Scheduled';
      case 'in_progress': return 'Work Started';
      case 'paused': return 'Work Paused';
      case 'completed': return 'Job Completed';
      case 'cancelled': return 'Job Cancelled';
      default: return status.replace('_', ' ');
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const calculateDuration = () => {
    if (timeline.length < 2) return null;
    
    const startTime = timeline.find(t => t.status === 'in_progress')?.timestamp;
    const endTime = timeline.find(t => t.status === 'completed')?.timestamp;
    
    if (!startTime) return null;
    
    const currentTime = endTime || new Date();
    const duration = Math.round((currentTime.getTime() - startTime.getTime()) / (1000 * 60));
    
    return duration;
  };

  const currentDuration = calculateDuration();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Job Timeline</Text>
        {(estimatedDuration || currentDuration) && (
          <View style={styles.durationInfo}>
            {estimatedDuration && (
              <Text style={styles.estimatedDuration}>
                Est: {formatDuration(estimatedDuration)}
              </Text>
            )}
            {currentDuration && (
              <Text style={[
                styles.actualDuration,
                currentDuration > (estimatedDuration || 0) ? { color: Colors.warning } : { color: Colors.success }
              ]}>
                Actual: {formatDuration(currentDuration)}
              </Text>
            )}
          </View>
        )}
      </View>

      <ScrollView style={styles.timelineContainer} showsVerticalScrollIndicator={false}>
        {timeline.length === 0 ? (
          <View style={styles.emptyTimeline}>
            <Icons.Clock size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No timeline events yet</Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {timeline.map((event, index) => {
              const IconComponent = Icons[getStatusIcon(event.status) as keyof typeof Icons] as any;
              const isLast = index === timeline.length - 1;
              const isCurrent = event.status === currentStatus;
              
              return (
                <View key={index} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineIcon,
                      { backgroundColor: getStatusColor(event.status) + '20' },
                      isCurrent && styles.currentTimelineIcon
                    ]}>
                      <IconComponent 
                        size={16} 
                        color={getStatusColor(event.status)} 
                      />
                    </View>
                    {!isLast && <View style={styles.timelineLine} />}
                  </View>
                  
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineHeader}>
                      <Text style={[
                        styles.timelineStatus,
                        isCurrent && styles.currentTimelineStatus
                      ]}>
                        {getStatusLabel(event.status)}
                      </Text>
                      <Text style={styles.timelineTime}>
                        {event.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Text>
                    </View>
                    
                    <Text style={styles.timelineDate}>
                      {event.timestamp.toLocaleDateString()}
                    </Text>
                    
                    {event.mechanicId && (
                      <Text style={styles.timelineMechanic}>
                        by {event.mechanicId === 'mechanic-cody' ? 'Cody Owner' : event.mechanicId}
                      </Text>
                    )}
                    
                    {event.notes && (
                      <Text style={styles.timelineNotes}>
                        {event.notes}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Duration Summary */}
      {actualDuration && (
        <View style={styles.durationSummary}>
          <View style={styles.durationRow}>
            <Text style={styles.durationLabel}>Total Duration:</Text>
            <Text style={styles.durationValue}>{formatDuration(actualDuration)}</Text>
          </View>
          {estimatedDuration && (
            <View style={styles.durationRow}>
              <Text style={styles.durationLabel}>vs Estimated:</Text>
              <Text style={[
                styles.durationComparison,
                actualDuration > estimatedDuration ? { color: Colors.warning } : { color: Colors.success }
              ]}>
                {actualDuration > estimatedDuration ? '+' : ''}{formatDuration(actualDuration - estimatedDuration)}
              </Text>
            </View>
          )}
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
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  durationInfo: {
    alignItems: 'flex-end',
  },
  estimatedDuration: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  actualDuration: {
    fontSize: 12,
    fontWeight: '600',
  },
  timelineContainer: {
    maxHeight: 300,
  },
  emptyTimeline: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 8,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  currentTimelineIcon: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '30',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginTop: 8,
    minHeight: 20,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  currentTimelineStatus: {
    color: Colors.primary,
  },
  timelineTime: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  timelineDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  timelineMechanic: {
    fontSize: 11,
    color: Colors.mechanic,
    marginBottom: 4,
  },
  timelineNotes: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  durationSummary: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  durationLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  durationValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  durationComparison: {
    fontSize: 12,
    fontWeight: '600',
  },
});