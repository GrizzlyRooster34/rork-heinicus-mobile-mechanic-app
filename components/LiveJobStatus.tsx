import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Icons from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useJobTracking } from '@/hooks/useJobTracking';

interface LiveJobStatusProps {
  jobId: string;
  initialStatus?: string | null;
  initialEta?: Date | string | null;
}

const formatStatus = (status?: string | null) => {
  if (!status) {
    return 'Live updates unavailable';
  }

  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export function LiveJobStatus({ jobId, initialStatus, initialEta }: LiveJobStatusProps) {
  const { status, etaMinutes, isConnected } = useJobTracking(jobId, initialStatus, initialEta);

  if (!status && etaMinutes === null && !isConnected) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <Icons.Radio size={12} color={isConnected ? Colors.success : Colors.textMuted} />
        <Text style={styles.statusText}>{formatStatus(status)}</Text>
      </View>
      {typeof etaMinutes === 'number' && (
        <View style={styles.etaRow}>
          <Icons.Clock3 size={12} color={Colors.primary} />
          <Text style={styles.etaText}>ETA {etaMinutes} min</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    gap: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  etaText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
});
