import type { Server as SocketIOServer } from 'socket.io';

let realtimeServer: SocketIOServer | null = null;

export const setRealtimeServer = (io: SocketIOServer) => {
  realtimeServer = io;
};

export const getRealtimeServer = () => realtimeServer;

export const emitToJobRoom = (jobId: string, event: string, payload: unknown) => {
  realtimeServer?.to(`job-${jobId}`).emit(event, payload);
};
