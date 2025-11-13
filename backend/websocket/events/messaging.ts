import { Server, Socket } from 'socket.io';
import { sendMessage, markMessageAsRead } from '../../../services/messaging';
import { prisma } from '../../../lib/prisma';

/**
 * Messaging Event Handlers
 *
 * Handles real-time messaging between customers and mechanics
 */

export function registerMessageEvents(io: Server, socket: Socket) {
  const user = socket.data.user;

  console.log(`Messaging events registered for ${user.email}`);

  /**
   * Send a message
   */
  socket.on('message:send', async (data: {
    jobId: string;
    content: string;
    type?: 'TEXT' | 'IMAGE' | 'FILE';
    mediaUrl?: string;
  }) => {
    try {
      const { jobId, content, type = 'TEXT', mediaUrl } = data;

      // Send message via service
      const result = await sendMessage({
        jobId,
        senderId: user.userId,
        content,
        type,
        mediaUrl,
      });

      if (!result.success) {
        socket.emit('error', {
          message: result.error || 'Failed to send message',
          code: 'MESSAGE_SEND_ERROR',
        });
        return;
      }

      // Broadcast message to job room
      const roomName = `job-${jobId}`;
      io.to(roomName).emit('message:new', {
        message: result.message,
        timestamp: new Date().toISOString(),
      });

      console.log(`Message sent in job ${jobId} by ${user.email}`);
    } catch (error) {
      console.error('Error in message:send:', error);
      socket.emit('error', {
        message: 'Failed to send message',
        code: 'MESSAGE_SEND_ERROR',
      });
    }
  });

  /**
   * Mark message as read
   */
  socket.on('message:read', async (data: { messageId: string }) => {
    try {
      const { messageId } = data;

      const result = await markMessageAsRead(messageId, user.userId);

      if (result.success) {
        // Get message details to broadcast to sender
        const message = await prisma.message.findUnique({
          where: { id: messageId },
          select: {
            id: true,
            jobId: true,
            senderId: true,
          },
        });

        if (message) {
          const roomName = `job-${message.jobId}`;
          io.to(roomName).emit('message:read-receipt', {
            messageId,
            readBy: user.userId,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error('Error in message:read:', error);
    }
  });

  /**
   * User is typing indicator
   */
  socket.on('message:typing', (data: { jobId: string; isTyping: boolean }) => {
    try {
      const { jobId, isTyping } = data;

      const roomName = `job-${jobId}`;

      // Broadcast typing indicator to others in the room
      socket.to(roomName).emit('message:typing-indicator', {
        userId: user.userId,
        jobId,
        isTyping,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in message:typing:', error);
    }
  });

  /**
   * Message delivered confirmation
   */
  socket.on('message:delivered', (data: { messageId: string }) => {
    try {
      const { messageId } = data;

      // Could update database with delivered status if needed
      console.log(`Message ${messageId} delivered to ${user.email}`);
    } catch (error) {
      console.error('Error in message:delivered:', error);
    }
  });
}
