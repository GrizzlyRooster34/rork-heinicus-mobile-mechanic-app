import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth-store';

/**
 * WebSocket Client for Real-Time Features
 *
 * Handles WebSocket connections with automatic authentication and reconnection
 */

const WEBSOCKET_URL = process.env.EXPO_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';

class WebSocketClient {
  private socket: Socket | null = null;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  /**
   * Initialize WebSocket connection
   */
  connect(): void {
    if (this.socket?.connected || this.isConnecting) {
      console.log('WebSocket: Already connected or connecting');
      return;
    }

    this.isConnecting = true;

    // Get JWT token from auth store
    const token = useAuthStore.getState().token;

    if (!token) {
      console.warn('WebSocket: No authentication token available');
      this.isConnecting = false;
      return;
    }

    console.log('WebSocket: Connecting to', WEBSOCKET_URL);

    this.socket = io(WEBSOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupEventHandlers();
    this.isConnecting = false;
  }

  /**
   * Setup event handlers for connection management
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket: Connected successfully', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('connected', (data) => {
      console.log('WebSocket: Server confirmed connection', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket: Disconnected -', reason);

      // Auto-reconnect for certain reasons
      if (reason === 'io server disconnect') {
        // Server disconnected, manually reconnect
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket: Connection error:', error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('WebSocket: Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket: Error:', error);
    });

    // Handle authentication errors
    this.socket.on('connect_error', (err) => {
      if (err.message.includes('Authentication error')) {
        console.error('WebSocket: Authentication failed');
        this.disconnect();
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      console.log('WebSocket: Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get the underlying Socket.io socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  // ========================================
  // Job Tracking Methods
  // ========================================

  /**
   * Join a job room to receive real-time updates
   */
  joinJob(jobId: string): void {
    if (!this.socket?.connected) {
      console.warn('WebSocket: Cannot join job - not connected');
      return;
    }

    console.log('WebSocket: Joining job room', jobId);
    this.socket.emit('job:join', { jobId });
  }

  /**
   * Leave a job room
   */
  leaveJob(jobId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    console.log('WebSocket: Leaving job room', jobId);
    this.socket.emit('job:leave', { jobId });
  }

  /**
   * Update job status (mechanic only)
   */
  updateJobStatus(jobId: string, status: string, notes?: string): void {
    if (!this.socket?.connected) {
      console.warn('WebSocket: Cannot update job status - not connected');
      return;
    }

    console.log('WebSocket: Updating job status', { jobId, status });
    this.socket.emit('job:update-status', { jobId, status, notes });
  }

  /**
   * Update mechanic location during job
   */
  updateLocation(jobId: string, latitude: number, longitude: number, eta?: number): void {
    if (!this.socket?.connected) {
      console.warn('WebSocket: Cannot update location - not connected');
      return;
    }

    this.socket.emit('job:update-location', {
      jobId,
      latitude,
      longitude,
      eta,
    });
  }

  /**
   * Update estimated time of arrival
   */
  updateETA(jobId: string, etaMinutes: number): void {
    if (!this.socket?.connected) {
      console.warn('WebSocket: Cannot update ETA - not connected');
      return;
    }

    console.log('WebSocket: Updating ETA', { jobId, etaMinutes });
    this.socket.emit('job:update-eta', { jobId, etaMinutes });
  }

  // ========================================
  // Event Listeners
  // ========================================

  /**
   * Listen for job status updates
   */
  onJobStatusUpdated(callback: (data: any) => void): void {
    this.socket?.on('job:status-updated', callback);
  }

  /**
   * Listen for location updates
   */
  onLocationUpdated(callback: (data: any) => void): void {
    this.socket?.on('job:location-updated', callback);
  }

  /**
   * Listen for ETA updates
   */
  onETAUpdated(callback: (data: any) => void): void {
    this.socket?.on('job:eta-updated', callback);
  }

  /**
   * Listen for job room join confirmation
   */
  onJobJoined(callback: (data: any) => void): void {
    this.socket?.on('job:joined', callback);
  }

  /**
   * Listen for errors
   */
  onError(callback: (data: any) => void): void {
    this.socket?.on('error', callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback?: (...args: any[]) => void): void {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: string): void {
    this.socket?.removeAllListeners(event);
  }
}

// Export singleton instance
export const wsClient = new WebSocketClient();

// Auto-connect when token is available
useAuthStore.subscribe((state) => {
  if (state.isAuthenticated && state.token) {
    wsClient.connect();
  } else {
    wsClient.disconnect();
  }
});
