import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/auth-store';

interface WebSocketConfig {
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

interface ChatMessage {
  id: string;
  message: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE';
  attachments: string[];
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  createdAt: Date;
}

interface Quote {
  quoteId: string;
  jobId: string;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  estimatedDuration: number;
  validUntil: Date;
  notes?: string;
  parts: Array<{
    partName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    description?: string;
  }>;
}

interface LocationUpdate {
  jobId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
}

interface JobStatusUpdate {
  jobId: string;
  status: string;
  notes?: string;
  timestamp: Date;
}

export function useWebSocket(config: WebSocketConfig = {}) {
  const { user, token } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [locationUpdates, setLocationUpdates] = useState<LocationUpdate[]>([]);
  const [jobStatusUpdates, setJobStatusUpdates] = useState<JobStatusUpdate[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const currentJobId = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !token) return;

    const socketInstance = io(process.env.EXPO_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001', {
      auth: {
        token: token
      },
      autoConnect: config.autoConnect !== false,
      reconnectionAttempts: config.reconnectionAttempts || 5,
      reconnectionDelay: config.reconnectionDelay || 1000
    });

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
      setError(null);
    });

    socketInstance.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err);
      setError(err.message);
    });

    // Message event handlers
    socketInstance.on('new-message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    socketInstance.on('quote-received', (quote: Quote) => {
      setQuotes(prev => [...prev, quote]);
    });

    socketInstance.on('mechanic-location', (update: LocationUpdate) => {
      setLocationUpdates(prev => [...prev.filter(u => u.jobId !== update.jobId), update]);
    });

    socketInstance.on('job-status-updated', (update: JobStatusUpdate) => {
      setJobStatusUpdates(prev => [...prev, update]);
    });

    socketInstance.on('error', (error: { message: string }) => {
      setError(error.message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user, token, config]);

  // Join a specific job channel
  const joinJob = (jobId: string) => {
    if (socket && connected) {
      socket.emit('join-job', jobId);
      currentJobId.current = jobId;
    }
  };

  // Leave a specific job channel
  const leaveJob = (jobId: string) => {
    if (socket && connected) {
      socket.emit('leave-job', jobId);
      if (currentJobId.current === jobId) {
        currentJobId.current = null;
      }
    }
  };

  // Send a chat message
  const sendMessage = (
    jobId: string,
    message: string,
    messageType: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT',
    attachments: string[] = []
  ) => {
    if (socket && connected) {
      socket.emit('send-message', {
        jobId,
        message,
        messageType,
        attachments
      });
    }
  };

  // Update location (for mechanics)
  const updateLocation = (jobId: string, latitude: number, longitude: number) => {
    if (socket && connected) {
      socket.emit('update-location', {
        jobId,
        latitude,
        longitude
      });
    }
  };

  // Update job status
  const updateJobStatus = (jobId: string, status: string, notes?: string) => {
    if (socket && connected) {
      socket.emit('update-job-status', {
        jobId,
        status,
        notes
      });
    }
  };

  // Send a quote (for mechanics)
  const sendQuote = (
    jobId: string,
    laborCost: number,
    partsCost: number,
    estimatedDuration: number,
    parts: Array<{
      partName: string;
      quantity: number;
      unitPrice: number;
      description?: string;
    }>,
    notes?: string
  ) => {
    if (socket && connected) {
      socket.emit('send-quote', {
        jobId,
        laborCost,
        partsCost,
        estimatedDuration,
        parts,
        notes
      });
    }
  };

  // Clear messages for a specific job
  const clearJobMessages = (jobId: string) => {
    setMessages(prev => prev.filter(msg => 
      // This would need to be enhanced to track jobId per message
      true // For now, keep all messages
    ));
  };

  // Get the latest location for a job
  const getLatestLocation = (jobId: string): LocationUpdate | null => {
    const jobUpdates = locationUpdates.filter(update => update.jobId === jobId);
    return jobUpdates.length > 0 ? jobUpdates[jobUpdates.length - 1] : null;
  };

  // Get the latest job status
  const getLatestJobStatus = (jobId: string): JobStatusUpdate | null => {
    const jobUpdates = jobStatusUpdates.filter(update => update.jobId === jobId);
    return jobUpdates.length > 0 ? jobUpdates[jobUpdates.length - 1] : null;
  };

  return {
    socket,
    connected,
    error,
    messages,
    quotes,
    locationUpdates,
    jobStatusUpdates,
    
    // Actions
    joinJob,
    leaveJob,
    sendMessage,
    updateLocation,
    updateJobStatus,
    sendQuote,
    clearJobMessages,
    
    // Getters
    getLatestLocation,
    getLatestJobStatus,
    
    // Current job
    currentJobId: currentJobId.current
  };
}

export default useWebSocket;