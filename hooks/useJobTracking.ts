import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { getRealtimeSocket } from '@/lib/socket';

type JobTrackingState = {
  status: string | null;
  eta: Date | null;
  etaMinutes: number | null;
  isConnected: boolean;
};

const normalizeStatus = (status?: string | null) =>
  status ? status.toLowerCase().replace(/-/g, '_') : null;

export const useJobTracking = (
  jobId: string | null | undefined,
  initialStatus?: string | null,
  initialEta?: Date | string | null
) => {
  const token = useAuthStore((state) => state.token);
  const [state, setState] = useState<JobTrackingState>({
    status: normalizeStatus(initialStatus),
    eta: initialEta ? new Date(initialEta) : null,
    etaMinutes: initialEta ? Math.max(0, Math.round((new Date(initialEta).getTime() - Date.now()) / 60000)) : null,
    isConnected: false,
  });

  useEffect(() => {
    setState((current) => ({
      ...current,
      status: normalizeStatus(initialStatus),
      eta: initialEta ? new Date(initialEta) : null,
      etaMinutes: initialEta
        ? Math.max(0, Math.round((new Date(initialEta).getTime() - Date.now()) / 60000))
        : null,
    }));
  }, [initialEta, initialStatus, jobId]);

  useEffect(() => {
    if (!jobId || !token) {
      setState((current) => ({ ...current, isConnected: false }));
      return;
    }

    const socket = getRealtimeSocket(token);
    if (!socket) {
      return;
    }

    const joinJobRoom = () => {
      socket.emit('job:join', { jobId });
    };

    const handleConnect = () => {
      setState((current) => ({ ...current, isConnected: true }));
      joinJobRoom();
    };

    const handleDisconnect = () => {
      setState((current) => ({ ...current, isConnected: false }));
    };

    const handleStatusUpdated = (payload: { jobId: string; status: string }) => {
      if (payload.jobId !== jobId) {
        return;
      }

      setState((current) => ({
        ...current,
        status: normalizeStatus(payload.status),
      }));
    };

    const handleEtaUpdated = (payload: { jobId: string; eta?: string | Date | null; etaMinutes?: number | null }) => {
      if (payload.jobId !== jobId) {
        return;
      }

      const nextEta = payload.eta ? new Date(payload.eta) : null;
      setState((current) => ({
        ...current,
        eta: nextEta,
        etaMinutes:
          typeof payload.etaMinutes === 'number'
            ? payload.etaMinutes
            : nextEta
              ? Math.max(0, Math.round((nextEta.getTime() - Date.now()) / 60000))
              : null,
      }));
    };

    const handleLocationUpdated = (payload: { jobId: string; eta?: string | Date | null }) => {
      if (payload.jobId !== jobId || !payload.eta) {
        return;
      }

      const nextEta = new Date(payload.eta);
      setState((current) => ({
        ...current,
        eta: nextEta,
        etaMinutes: Math.max(0, Math.round((nextEta.getTime() - Date.now()) / 60000)),
      }));
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('job:status-updated', handleStatusUpdated);
    socket.on('job:eta-updated', handleEtaUpdated);
    socket.on('job:location-updated', handleLocationUpdated);

    return () => {
      socket.emit('job:leave', { jobId });
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('job:status-updated', handleStatusUpdated);
      socket.off('job:eta-updated', handleEtaUpdated);
      socket.off('job:location-updated', handleLocationUpdated);
    };
  }, [jobId, token]);

  return state;
};
