import { useState, useEffect, useCallback, useRef } from 'react';
import { wsClient } from '@/lib/websocket';

/**
 * Job Location Update
 */
export interface JobLocation {
  latitude: number;
  longitude: number;
  eta?: Date;
  timestamp: string;
}

/**
 * Job Status Update
 */
export interface JobStatusUpdate {
  jobId: string;
  status: string;
  notes?: string;
  updatedBy: {
    userId: string;
    email: string;
    role: string;
  };
  timestamp: string;
}

/**
 * useJobTracking Hook
 *
 * Provides real-time job tracking functionality
 *
 * @param jobId - The job ID to track
 * @returns Job tracking state and methods
 */
export function useJobTracking(jobId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [isInRoom, setIsInRoom] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<JobLocation | null>(null);
  const [lastStatusUpdate, setLastStatusUpdate] = useState<JobStatusUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const jobIdRef = useRef(jobId);

  // Update ref when jobId changes
  useEffect(() => {
    jobIdRef.current = jobId;
  }, [jobId]);

  /**
   * Join job room
   */
  const joinJobRoom = useCallback(() => {
    if (!jobId) {
      console.warn('Cannot join job room: no jobId provided');
      return;
    }

    if (!wsClient.isConnected()) {
      console.warn('Cannot join job room: WebSocket not connected');
      setError('WebSocket not connected');
      return;
    }

    console.log('Joining job room:', jobId);
    wsClient.joinJob(jobId);
  }, [jobId]);

  /**
   * Leave job room
   */
  const leaveJobRoom = useCallback(() => {
    if (!jobId) return;

    console.log('Leaving job room:', jobId);
    wsClient.leaveJob(jobId);
    setIsInRoom(false);
  }, [jobId]);

  /**
   * Update job status (mechanic only)
   */
  const updateStatus = useCallback(
    (status: string, notes?: string) => {
      if (!jobId) {
        console.warn('Cannot update status: no jobId provided');
        return;
      }

      wsClient.updateJobStatus(jobId, status, notes);
    },
    [jobId]
  );

  /**
   * Update mechanic location
   */
  const updateLocation = useCallback(
    (latitude: number, longitude: number, etaMinutes?: number) => {
      if (!jobId) {
        console.warn('Cannot update location: no jobId provided');
        return;
      }

      wsClient.updateLocation(jobId, latitude, longitude, etaMinutes);
    },
    [jobId]
  );

  /**
   * Update ETA
   */
  const updateETA = useCallback(
    (etaMinutes: number) => {
      if (!jobId) {
        console.warn('Cannot update ETA: no jobId provided');
        return;
      }

      wsClient.updateETA(jobId, etaMinutes);
    },
    [jobId]
  );

  // Setup event listeners
  useEffect(() => {
    // Check WebSocket connection status
    const checkConnection = () => {
      setIsConnected(wsClient.isConnected());
    };

    checkConnection();
    const interval = setInterval(checkConnection, 2000);

    // Event listeners
    const handleJobJoined = (data: any) => {
      console.log('Job room joined:', data);
      setIsInRoom(true);
      setError(null);
    };

    const handleJobLeft = (data: any) => {
      console.log('Job room left:', data);
      setIsInRoom(false);
    };

    const handleLocationUpdate = (data: any) => {
      console.log('Location updated:', data);

      // Only update if it's for the current job
      if (data.jobId === jobIdRef.current) {
        setCurrentLocation({
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          eta: data.eta ? new Date(data.eta) : undefined,
          timestamp: data.timestamp,
        });
      }
    };

    const handleStatusUpdate = (data: JobStatusUpdate) => {
      console.log('Status updated:', data);

      // Only update if it's for the current job
      if (data.jobId === jobIdRef.current) {
        setLastStatusUpdate(data);
      }
    };

    const handleETAUpdate = (data: any) => {
      console.log('ETA updated:', data);

      // Only update if it's for the current job
      if (data.jobId === jobIdRef.current && currentLocation) {
        setCurrentLocation({
          ...currentLocation,
          eta: new Date(data.eta),
          timestamp: data.timestamp,
        });
      }
    };

    const handleError = (data: any) => {
      console.error('WebSocket error:', data);
      setError(data.message || 'An error occurred');
    };

    // Register event listeners
    wsClient.onJobJoined(handleJobJoined);
    wsClient.onLocationUpdated(handleLocationUpdate);
    wsClient.onJobStatusUpdated(handleStatusUpdate);
    wsClient.onETAUpdated(handleETAUpdate);
    wsClient.onError(handleError);

    // Auto-join room when connected and jobId is available
    if (jobId && wsClient.isConnected()) {
      joinJobRoom();
    }

    // Cleanup
    return () => {
      wsClient.off('job:joined', handleJobJoined);
      wsClient.off('job:location-updated', handleLocationUpdate);
      wsClient.off('job:status-updated', handleStatusUpdate);
      wsClient.off('job:eta-updated', handleETAUpdate);
      wsClient.off('error', handleError);

      clearInterval(interval);

      // Leave room on unmount if we were in one
      if (isInRoom && jobId) {
        leaveJobRoom();
      }
    };
  }, [jobId, joinJobRoom, leaveJobRoom, isInRoom, currentLocation]);

  return {
    // State
    isConnected,
    isInRoom,
    currentLocation,
    lastStatusUpdate,
    error,

    // Methods
    joinJobRoom,
    leaveJobRoom,
    updateStatus,
    updateLocation,
    updateETA,
  };
}
