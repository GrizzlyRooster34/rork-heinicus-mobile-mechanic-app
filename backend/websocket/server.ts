import { createServer } from 'http';
import { Server } from 'socket.io';
import { prisma } from '../../lib/prisma';
import jwt from 'jsonwebtoken';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store active connections
const activeConnections = new Map<string, { socketId: string; userId: string; role: string }>();

// Middleware for authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication required'));
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || 'default-secret'
    ) as { userId: string; email: string; role: string };

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.isActive) {
      return next(new Error('Invalid user'));
    }

    // Attach user info to socket
    socket.data.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    };

    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  const user = socket.data.user;
  
  console.log(`User connected: ${user.firstName} ${user.lastName} (${user.role})`);
  
  // Store connection
  activeConnections.set(socket.id, {
    socketId: socket.id,
    userId: user.id,
    role: user.role
  });

  // Join user-specific room
  socket.join(`user:${user.id}`);
  
  // Join role-specific room
  socket.join(`role:${user.role.toLowerCase()}`);

  // Handle job-related events
  socket.on('join-job', (jobId: string) => {
    socket.join(`job:${jobId}`);
    console.log(`User ${user.id} joined job ${jobId}`);
  });

  socket.on('leave-job', (jobId: string) => {
    socket.leave(`job:${jobId}`);
    console.log(`User ${user.id} left job ${jobId}`);
  });

  // Handle chat messages
  socket.on('send-message', async (data: {
    jobId: string;
    message: string;
    messageType?: 'TEXT' | 'IMAGE' | 'FILE';
    attachments?: string[];
  }) => {
    try {
      // Save message to database
      const chatMessage = await prisma.chatMessage.create({
        data: {
          jobId: data.jobId,
          senderId: user.id,
          message: data.message,
          messageType: data.messageType || 'TEXT',
          attachments: data.attachments || []
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        }
      });

      // Broadcast to job participants
      io.to(`job:${data.jobId}`).emit('new-message', {
        id: chatMessage.id,
        message: chatMessage.message,
        messageType: chatMessage.messageType,
        attachments: chatMessage.attachments,
        sender: chatMessage.sender,
        createdAt: chatMessage.createdAt
      });

      // Send notification to offline users
      await sendOfflineNotification(data.jobId, user.id, 'CHAT_MESSAGE', {
        message: `New message from ${user.firstName}: ${data.message}`,
        jobId: data.jobId
      });

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle location updates (for mechanics)
  socket.on('update-location', async (data: {
    jobId: string;
    latitude: number;
    longitude: number;
  }) => {
    try {
      if (user.role !== 'MECHANIC') {
        socket.emit('error', { message: 'Only mechanics can update location' });
        return;
      }

      // Update job with mechanic location
      await prisma.job.update({
        where: { id: data.jobId },
        data: {
          latitude: data.latitude,
          longitude: data.longitude
        }
      });

      // Broadcast location to customer
      io.to(`job:${data.jobId}`).emit('mechanic-location', {
        jobId: data.jobId,
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error updating location:', error);
      socket.emit('error', { message: 'Failed to update location' });
    }
  });

  // Handle job status updates
  socket.on('update-job-status', async (data: {
    jobId: string;
    status: string;
    notes?: string;
  }) => {
    try {
      // Update job status
      const updatedJob = await prisma.job.update({
        where: { id: data.jobId },
        data: {
          status: data.status as any,
          ...(data.notes && { mechanicNotes: data.notes })
        },
        include: {
          customer: true,
          mechanic: true
        }
      });

      // Create timeline entry
      await prisma.jobTimeline.create({
        data: {
          jobId: data.jobId,
          event: getTimelineEvent(data.status),
          description: `Job status updated to ${data.status}`,
          metadata: { notes: data.notes }
        }
      });

      // Broadcast to job participants
      io.to(`job:${data.jobId}`).emit('job-status-updated', {
        jobId: data.jobId,
        status: data.status,
        notes: data.notes,
        timestamp: new Date()
      });

      // Send notification
      await sendOfflineNotification(data.jobId, user.id, 'JOB_UPDATE', {
        message: `Job status updated to ${data.status}`,
        jobId: data.jobId
      });

    } catch (error) {
      console.error('Error updating job status:', error);
      socket.emit('error', { message: 'Failed to update job status' });
    }
  });

  // Handle quote updates
  socket.on('send-quote', async (data: {
    jobId: string;
    laborCost: number;
    partsCost: number;
    estimatedDuration: number;
    notes?: string;
    parts: Array<{
      partName: string;
      quantity: number;
      unitPrice: number;
      description?: string;
    }>;
  }) => {
    try {
      const totalCost = data.laborCost + data.partsCost;
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 7); // Quote valid for 7 days

      // Create quote
      const quote = await prisma.quote.create({
        data: {
          jobId: data.jobId,
          laborCost: data.laborCost,
          partsCost: data.partsCost,
          totalCost: totalCost,
          estimatedDuration: data.estimatedDuration,
          validUntil: validUntil,
          notes: data.notes,
          parts: {
            create: data.parts.map(part => ({
              partName: part.partName,
              quantity: part.quantity,
              unitPrice: part.unitPrice,
              totalPrice: part.quantity * part.unitPrice,
              description: part.description
            }))
          }
        },
        include: {
          parts: true
        }
      });

      // Update job status
      await prisma.job.update({
        where: { id: data.jobId },
        data: { status: 'QUOTED' }
      });

      // Broadcast to job participants
      io.to(`job:${data.jobId}`).emit('quote-received', {
        quoteId: quote.id,
        jobId: data.jobId,
        laborCost: quote.laborCost,
        partsCost: quote.partsCost,
        totalCost: quote.totalCost,
        estimatedDuration: quote.estimatedDuration,
        validUntil: quote.validUntil,
        notes: quote.notes,
        parts: quote.parts
      });

      // Send notification
      await sendOfflineNotification(data.jobId, user.id, 'JOB_UPDATE', {
        message: `Quote received: $${totalCost.toFixed(2)}`,
        jobId: data.jobId
      });

    } catch (error) {
      console.error('Error sending quote:', error);
      socket.emit('error', { message: 'Failed to send quote' });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${user.firstName} ${user.lastName}`);
    activeConnections.delete(socket.id);
  });
});

// Helper function to send notifications to offline users
async function sendOfflineNotification(
  jobId: string,
  senderId: string,
  type: 'JOB_UPDATE' | 'CHAT_MESSAGE' | 'PAYMENT_UPDATE',
  data: any
) {
  try {
    // Get job participants
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        customerId: true,
        mechanicId: true
      }
    });

    if (!job) return;

    const recipients = [job.customerId, job.mechanicId].filter(
      (id): id is string => id !== null && id !== undefined && id !== senderId
    );

    // Check who's online
    const onlineUsers = Array.from(activeConnections.values()).map(conn => conn.userId);
    const offlineUsers = recipients.filter(userId => !onlineUsers.includes(userId));

    // Send notifications to offline users
    for (const userId of offlineUsers) {
      if (userId) {
        await prisma.notification.create({
          data: {
            userId: userId,
            type: type,
            title: getNotificationTitle(type),
            message: data.message,
            data: data
          }
        });
      }
    }

    // TODO: Send push notifications to offline users
    // This would integrate with FCM/APNS
    
  } catch (error) {
    console.error('Error sending offline notification:', error);
  }
}

// Helper functions
function getTimelineEvent(status: string): any {
  const eventMap: Record<string, any> = {
    'PENDING': 'JOB_CREATED',
    'QUOTED': 'QUOTE_SENT',
    'ACCEPTED': 'QUOTE_ACCEPTED',
    'ASSIGNED': 'MECHANIC_ASSIGNED',
    'IN_PROGRESS': 'SERVICE_STARTED',
    'COMPLETED': 'SERVICE_COMPLETED',
    'CANCELLED': 'JOB_CANCELLED'
  };
  return eventMap[status] || 'JOB_CREATED';
}

function getNotificationTitle(type: string): string {
  const titleMap: Record<string, string> = {
    'JOB_UPDATE': 'Job Update',
    'CHAT_MESSAGE': 'New Message',
    'PAYMENT_UPDATE': 'Payment Update'
  };
  return titleMap[type] || 'Notification';
}

const PORT = process.env.WEBSOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});

export { io };