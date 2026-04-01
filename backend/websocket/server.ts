import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { UserRole } from '@prisma/client';
import { extractToken, verifyToken, verifyUserStatus } from '../middleware/auth';
import { registerJobTrackingEvents } from './events/job-tracking';
import { registerMessageEvents } from './events/messaging';

type AuthenticatedSocketUser = {
  userId: string;
  email: string;
  role: UserRole;
};

export function createRealtimeServer(httpServer: HttpServer) {
  const rawOrigins = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '';
  const allowedOrigins = rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins.length > 0 ? allowedOrigins : true,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use(async (socket, next) => {
    try {
      const handshakeToken =
        typeof socket.handshake.auth?.token === 'string' ? socket.handshake.auth.token : undefined;
      const headerToken =
        typeof socket.handshake.headers.authorization === 'string'
          ? socket.handshake.headers.authorization
          : undefined;
      const token = extractToken(handshakeToken || headerToken);

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = verifyToken(token);
      const isActive = await verifyUserStatus(decoded.userId);
      if (!isActive) {
        return next(new Error('Authentication error: User account is inactive'));
      }

      socket.data.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      } satisfies AuthenticatedSocketUser;

      socket.data.token = token;
      next();
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as AuthenticatedSocketUser;

    socket.emit('connected', {
      message: 'Connected to Heinicus realtime server',
      userId: user.userId,
      timestamp: new Date().toISOString(),
    });

    registerJobTrackingEvents(io, socket);
    registerMessageEvents(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`WebSocket client disconnected: ${user.email} (${reason})`);
    });
  });

  return io;
}
