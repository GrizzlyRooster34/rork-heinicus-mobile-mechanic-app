import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocation, formatDistance } from '@/hooks/useLocation';
import { useJobTracking } from '@/hooks/useJobTracking';
import { trpcClient } from '@/lib/trpc';

/**
 * MechanicLocationTracker Component
 *
 * Tracks mechanic's location and broadcasts it in real-time during active jobs
 * Automatically calculates and updates ETA
 */

interface MechanicLocationTrackerProps {
  jobId: string;
  isActive: boolean; // Only track when job is active (ACCEPTED or IN_PROGRESS)
  updateInterval?: number; // Update interval in seconds (default: 10)
}

export function MechanicLocationTracker({
  jobId,
  isActive,
  updateInterval = 10,
}: MechanicLocationTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [distanceToJob, setDistanceToJob] = useState<number | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);

  const {
    location,
    permissionStatus,
    isLoading,
    requestBackgroundPermission,
    watchLocation,
  } = useLocation({
    enableHighAccuracy: true,
    watch: true,
    distanceFilter: 10, // Update every 10 meters
  });

  const { updateLocation, isConnected } = useJobTracking(jobId);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastBroadcastRef = useRef<Date | null>(null);

  // Start/stop tracking based on isActive prop
  useEffect(() => {
    if (isActive && permissionStatus === 'granted') {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [isActive, permissionStatus]);

  // Broadcast location updates
  useEffect(() => {
    if (!isTracking || !location || !isConnected) return;

    const now = new Date();
    const lastBroadcast = lastBroadcastRef.current;

    // Check if enough time has passed since last broadcast
    if (
      !lastBroadcast ||
      now.getTime() - lastBroadcast.getTime() >= updateInterval * 1000
    ) {
      broadcastLocation();
      lastBroadcastRef.current = now;
    }
  }, [location, isTracking, isConnected]);

  /**
   * Start location tracking
   */
  const startTracking = async () => {
    try {
      // Request background permission for mechanics
      if (permissionStatus !== 'granted') {
        const granted = await requestBackgroundPermission();
        if (!granted) {
          Alert.alert(
            'Location Permission Required',
            'Please enable location access to track your position during jobs.'
          );
          return;
        }
      }

      setIsTracking(true);
      console.log('Started location tracking for job:', jobId);
    } catch (error) {
      console.error('Error starting location tracking:', error);
      Alert.alert('Error', 'Failed to start location tracking');
    }
  };

  /**
   * Stop location tracking
   */
  const stopTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsTracking(false);
    setLastUpdate(null);
    console.log('Stopped location tracking for job:', jobId);
  };

  /**
   * Broadcast current location to customers
   */
  const broadcastLocation = async () => {
    if (!location) return;

    try {
      // Calculate distance and ETA to job
      const distanceResult = await trpcClient.location.getMechanicDistanceToJob.query({
        jobId,
        mechanicLocation: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      });

      if (distanceResult.success && 'durationMinutes' in distanceResult) {
        setDistanceToJob(distanceResult.distanceMeters);
        setEtaMinutes(distanceResult.durationMinutes);

        // Broadcast location via WebSocket
        updateLocation(
          location.latitude,
          location.longitude,
          distanceResult.durationMinutes
        );

        setLastUpdate(new Date());
        console.log(
          `Location broadcast: ${distanceResult.distanceKm.toFixed(2)} km, ETA: ${distanceResult.durationMinutes} min`
        );
      }
    } catch (error) {
      console.error('Error broadcasting location:', error);
    }
  };

  // Manual broadcast button
  const handleManualBroadcast = () => {
    broadcastLocation();
  };

  if (!isActive) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Tracking Status */}
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, isTracking && isConnected ? styles.active : styles.inactive]} />
        <Text style={styles.statusText}>
          {isTracking && isConnected ? 'Tracking Active' : 'Tracking Inactive'}
        </Text>
      </View>

      {/* Location Info */}
      {location && (
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Accuracy:</Text>
            <Text style={styles.value}>
              {location.accuracy ? `${Math.round(location.accuracy)} m` : 'N/A'}
            </Text>
          </View>

          {distanceToJob && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Distance to Job:</Text>
              <Text style={styles.value}>{formatDistance(distanceToJob)}</Text>
            </View>
          )}

          {etaMinutes !== null && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>ETA:</Text>
              <Text style={styles.value}>
                {etaMinutes < 1 ? 'Arriving' : `${etaMinutes} min`}
              </Text>
            </View>
          )}

          {lastUpdate && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Last Update:</Text>
              <Text style={styles.value}>
                {lastUpdate.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Manual Update Button */}
      <TouchableOpacity
        style={[styles.button, !isConnected && styles.buttonDisabled]}
        onPress={handleManualBroadcast}
        disabled={!isConnected || !location}
      >
        <Text style={styles.buttonText}>Update Location Now</Text>
      </TouchableOpacity>

      {/* Permission Warning */}
      {permissionStatus !== 'granted' && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ Location permission required to track your position
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestBackgroundPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  active: {
    backgroundColor: '#4CAF50',
  },
  inactive: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoContainer: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: '#aaa',
    fontSize: 14,
  },
  value: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#555',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  warningContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FF9800',
    borderRadius: 8,
  },
  warningText: {
    color: '#000',
    fontSize: 12,
    marginBottom: 8,
  },
  permissionButton: {
    backgroundColor: '#000',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
