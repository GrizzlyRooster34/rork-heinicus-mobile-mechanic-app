import type { Server, Socket } from 'socket.io';
import { prisma } from '../../../lib/prisma';
import { markMessageAsRead, sendMessage } from '../../services/messaging';

export function registerMessageEvents(io: Server, socket: Socket) {
  const user = socket.data.user as { userId: string; email: string };

  socket.on(
    'message:send',
    async (data: { jobId: string; content: string; type?: 'TEXT' | 'IMAGE' | 'FILE'; mediaUrl?: string }) => {
      const result = await sendMessage({
        jobId: data.jobId,
        senderId: user.userId,
        content: data.content,
        type: data.type,
        mediaUrl: data.mediaUrl,
      });

      if (!result.success) {
        socket.emit('error', {
          message: result.error || 'Failed to send message',
          code: 'MESSAGE_SEND_ERROR',
        });
        return;
      }

      io.to(`job-${data.jobId}`).emit('message:new', {
        message: result.message,
        timestamp: new Date().toISOString(),
      });
    }
  );

  socket.on('message:read', async (data: { messageId: string }) => {
    const result = await markMessageAsRead(data.messageId, user.userId);
    if (!result.success) {
      return;
    }

    const message = await prisma.chatMessage.findUnique({
      where: { id: data.messageId },
      select: {
        id: true,
        jobId: true,
        senderId: true,
      },
    });

    if (!message) {
      return;
    }

    io.to(`job-${message.jobId}`).emit('message:read-receipt', {
      messageId: data.messageId,
      readBy: user.userId,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('message:typing', (data: { jobId: string; isTyping: boolean }) => {
    socket.to(`job-${data.jobId}`).emit('message:typing-indicator', {
      userId: user.userId,
      jobId: data.jobId,
      isTyping: data.isTyping,
      timestamp: new Date().toISOString(),
    });
  });
}
