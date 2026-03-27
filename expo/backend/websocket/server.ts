import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { verifyJWTToken } from '../middleware/auth';
import { registerJobTrackingEvents } from './events/job-tracking';
import { registerMessageEvents } from './events/messaging';

/**
 * WebSocket Server for Real-Time Features
 *
 * Handles:
 * - Real-time job tracking
 * - Live chat messaging
 * - Location updates
 * - Job status notifications
 */

const PORT = process.env.WEBSOCKET_PORT || 3001;
const CORS_ORIGIN = process.env.FRONTEND_URL || 'http://localhost:8081';

// Create HTTP server for Socket.io
const httpServer = createServer();

// Initialize Socket.io
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: [CORS_ORIGIN, 'http://localhost:3000', 'http://localhost:8081'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

/**
 * Authentication Middleware
 * Verifies JWT token before allowing WebSocket connection
 */
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify JWT token
    const decoded = verifyJWTToken(token);

    if (!decoded) {
      return next(new Error('Authentication error: Invalid token'));
    }

    // Attach user data to socket
    socket.data.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    console.log(`WebSocket: User authenticated - ${decoded.email} (${decoded.role})`);
    next();
  } catch (error) {
    console.error('WebSocket authentication error:', error);
    next(new Error('Authentication error'));
  }
});

/**
 * Connection Handler
 */
io.on('connection', (socket) => {
  const user = socket.data.user;
  console.log(`WebSocket: Client connected - ${user.email} (${socket.id})`);

  // Send welcome message
  socket.emit('connected', {
    message: 'Connected to Heinicus WebSocket server',
    userId: user.userId,
    timestamp: new Date().toISOString(),
  });

  // Register event handlers for different features
  registerJobTrackingEvents(io, socket);
  registerMessageEvents(io, socket);

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`WebSocket: Client disconnected - ${user.email} (${reason})`);
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`WebSocket: Socket error for ${user.email}:`, error);
  });
});

/**
 * Start WebSocket Server
 */
export function startWebSocketServer() {
  httpServer.listen(PORT, () => {
    console.log(`🔌 WebSocket server running on port ${PORT}`);
    console.log(`   CORS enabled for: ${CORS_ORIGIN}`);
    console.log(`   Ready for real-time connections`);
  });

  return io;
}

/**
 * Graceful Shutdown
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing WebSocket server');
  httpServer.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing WebSocket server');
  httpServer.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});

export default io;
