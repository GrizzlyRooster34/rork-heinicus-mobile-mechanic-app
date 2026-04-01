import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import { getApiBaseUrl } from '@/lib/api-base-url';

let realtimeSocket: Socket | null = null;
let activeToken: string | null = null;

export const getRealtimeSocket = (token?: string | null) => {
  if (!token) {
    return null;
  }

  if (realtimeSocket && activeToken === token) {
    if (!realtimeSocket.connected) {
      realtimeSocket.connect();
    }
    return realtimeSocket;
  }

  realtimeSocket?.disconnect();

  realtimeSocket = io(getApiBaseUrl(), {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    auth: {
      token,
    },
    extraHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
  activeToken = token;

  return realtimeSocket;
};

export const disconnectRealtimeSocket = () => {
  realtimeSocket?.disconnect();
  realtimeSocket = null;
  activeToken = null;
};
