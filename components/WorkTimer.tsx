import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button } from '@/components/Button';
import { Colors } from '@/constants/colors';
import * as Icons from 'lucide-react-native';

interface WorkTimerProps {
  jobId: string;
  onTimeUpdate?: (timeData: TimeData) => void;
  initialTime?: number; // in seconds
}

interface TimeData {
  jobId: string;
  startTime: Date | null;
  endTime: Date | null;
  totalSeconds: number;
  status: 'idle' | 'running' | 'paused' | 'completed';
  pausedDuration: number;
}

export default function WorkTimer({ jobId, onTimeUpdate, initialTime = 0 }: WorkTimerProps) {
  const [timeData, setTimeData] = useState<TimeData>({
    jobId,
    startTime: null,
    endTime: null,
    totalSeconds: initialTime,
    status: 'idle',
    pausedDuration: 0,
  });
  
  const [currentTime, setCurrentTime] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Update parent component when time data changes
    onTimeUpdate?.(timeData);
  }, [timeData, onTimeUpdate]);

  useEffect(() => {
    // Cleanup interval on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  const startTimer = () => {
    if (timeData.status === 'running') return;

    const now = new Date();
    const newTimeData = {
      ...timeData,
      startTime: timeData.startTime || now,
      status: 'running' as const,
    };

    setTimeData(newTimeData);

    // Start the interval
    const id = setInterval(() => {
      setCurrentTime(prev => prev + 1);
    }, 1000);

    setIntervalId(id);

    console.log('Timer started for job:', jobId, 'at', now.toISOString());
  };

  const pauseTimer = () => {
    if (timeData.status !== 'running') return;

    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }

    const newTimeData = {
      ...timeData,
      totalSeconds: timeData.totalSeconds + currentTime,
      status: 'paused' as const,
    };

    setTimeData(newTimeData);
    setCurrentTime(0);

    console.log('Timer paused for job:', jobId, 'Total time:', newTimeData.totalSeconds);
  };

  const completeTimer = () => {
    Alert.alert(
      'Complete Job Timer',
      'Mark this job as completed? This will stop the timer and record the final time.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => {
            if (intervalId) {
              clearInterval(intervalId);
              setIntervalId(null);
            }

            const now = new Date();
            const finalTotalSeconds = timeData.totalSeconds + currentTime;
            
            const newTimeData = {
              ...timeData,
              endTime: now,
              totalSeconds: finalTotalSeconds,
              status: 'completed' as const,
            };

            setTimeData(newTimeData);
            setCurrentTime(0);

            console.log('Job completed:', {
              jobId,
              startTime: timeData.startTime,
              endTime: now,
              totalSeconds: finalTotalSeconds,
              totalMinutes: Math.round(finalTotalSeconds / 60),
              totalHours: Math.round(finalTotalSeconds / 3600 * 100) / 100,
            });

            Alert.alert(
              'Job Completed',
              `Total time: ${formatTime(finalTotalSeconds)}

Time has been recorded for job ${jobId}`,
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  const resetTimer = () => {
    Alert.alert(
      'Reset Timer',
      'Are you sure you want to reset the timer? This will clear all recorded time.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            if (intervalId) {
              clearInterval(intervalId);
              setIntervalId(null);
            }

            setTimeData({
              jobId,
              startTime: null,
              endTime: null,
              totalSeconds: 0,
              status: 'idle',
              pausedDuration: 0,
            });
            setCurrentTime(0);

            console.log('Timer reset for job:', jobId);
          },
        },
      ]
    );
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalDisplayTime = () => {
    return timeData.totalSeconds + currentTime;
  };

  const getStatusColor = () => {
    switch (timeData.status) {
      case 'running':
        return Colors.success;
      case 'paused':
        return Colors.warning;
      case 'completed':
        return Colors.primary;
      default:
        return Colors.textMuted;
    }
  };

  const getStatusIcon = () => {
    switch (timeData.status) {
      case 'running':
        return <Icons.Play size={16} color={Colors.white} />;
      case 'paused':
        return <Icons.Pause size={16} color={Colors.white} />;
      case 'completed':
        return <Icons.CheckCircle size={16} color={Colors.white} />;
      default:
        return <Icons.Clock size={16} color={Colors.white} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icons.Timer size={24} color={Colors.primary} />
        <Text style={styles.title}>Work Timer</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          {getStatusIcon()}
          <Text style={styles.statusText}>
            {timeData.status.charAt(0).toUpperCase() + timeData.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.timeDisplay}>
        <Text style={styles.timeText}>
          {formatTime(getTotalDisplayTime())}
        </Text>
        <Text style={styles.jobIdText}>Job: {jobId}</Text>
      </View>

      <View style={styles.controls}>
        {timeData.status === 'idle' || timeData.status === 'paused' ? (
          <Button
            title={timeData.status === 'idle' ? 'Start Timer' : 'Resume'}
            onPress={startTimer}
            style={[styles.controlButton, { backgroundColor: Colors.success }]}
          />
        ) : (
          <Button
            title="Pause"
            onPress={pauseTimer}
            style={[styles.controlButton, { backgroundColor: Colors.warning }]}
          />
        )}

        <Button
          title="Complete"
          onPress={completeTimer}
          disabled={timeData.status === 'idle' || timeData.status === 'completed'}
          style={[styles.controlButton, { backgroundColor: Colors.primary }]}
        />

        <Button
          title="Reset"
          onPress={resetTimer}
          variant="outline"
          disabled={timeData.status === 'running'}
          style={styles.resetButton}
        />
      </View>

      {timeData.startTime && (
        <View style={styles.timeInfo}>
          <View style={styles.timeInfoRow}>
            <Text style={styles.timeInfoLabel}>Started:</Text>
            <Text style={styles.timeInfoValue}>
              {timeData.startTime.toLocaleTimeString()}
            </Text>
          </View>
          
          {timeData.endTime && (
            <View style={styles.timeInfoRow}>
              <Text style={styles.timeInfoLabel}>Completed:</Text>
              <Text style={styles.timeInfoValue}>
                {timeData.endTime.toLocaleTimeString()}
              </Text>
            </View>
          )}

          <View style={styles.timeInfoRow}>
            <Text style={styles.timeInfoLabel}>Total Time:</Text>
            <Text style={[styles.timeInfoValue, styles.totalTime]}>
              {formatTime(getTotalDisplayTime())}
            </Text>
          </View>
        </View>
      )}

      {timeData.status === 'completed' && (
        <View style={styles.completedInfo}>
          <Icons.CheckCircle size={20} color={Colors.success} />
          <Text style={styles.completedText}>
            Job completed in {formatTime(timeData.totalSeconds)}
          </Text>
        </View>
      )}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  timeDisplay: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
    backgroundColor: Colors.background,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.primary,
    fontFamily: 'monospace',
  },
  jobIdText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  controlButton: {
    flex: 1,
  },
  resetButton: {
    paddingHorizontal: 16,
  },
  timeInfo: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  timeInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInfoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  timeInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  totalTime: {
    fontWeight: '600',
    color: Colors.primary,
  },
  completedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.successBackground,
    borderRadius: 8,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.success,
  },
});