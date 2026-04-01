import { prisma } from '../../lib/prisma';

export interface MessageData {
  jobId: string;
  senderId: string;
  content: string;
  type?: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  mediaUrl?: string;
}

const buildStoredMessage = (content: string, type: MessageData['type'], mediaUrl?: string) => {
  if (!mediaUrl || !type || type === 'TEXT') {
    return content;
  }

  return `${content}\n${type}:${mediaUrl}`;
};

export async function sendMessage(data: MessageData): Promise<{
  success: boolean;
  message?: unknown;
  error?: string;
}> {
  try {
    const { jobId, senderId, content, type = 'TEXT', mediaUrl } = data;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        customerId: true,
        mechanicId: true,
      },
    });

    if (!job) {
      return { success: false, error: 'Job not found' };
    }

    const isAuthorized = job.customerId === senderId || job.mechanicId === senderId;
    if (!isAuthorized) {
      return { success: false, error: 'Not authorized to send messages for this job' };
    }

    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (!sender) {
      return { success: false, error: 'Sender not found' };
    }

    const message = await prisma.chatMessage.create({
      data: {
        jobId,
        senderId,
        senderName: `${sender.firstName} ${sender.lastName}`.trim(),
        senderType: sender.role,
        message: buildStoredMessage(content, type, mediaUrl),
      },
    });

    return { success: true, message };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: 'Failed to send message' };
  }
}

export async function getJobMessages(
  jobId: string,
  userId: string
): Promise<{ success: boolean; messages?: unknown[]; error?: string }> {
  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        customerId: true,
        mechanicId: true,
      },
    });

    if (!job) {
      return { success: false, error: 'Job not found' };
    }

    const isAuthorized = job.customerId === userId || job.mechanicId === userId;
    if (!isAuthorized) {
      return { success: false, error: 'Not authorized to view messages for this job' };
    }

    const messages = await prisma.chatMessage.findMany({
      where: { jobId },
      orderBy: { createdAt: 'asc' },
    });

    return { success: true, messages };
  } catch (error) {
    console.error('Error getting job messages:', error);
    return { success: false, error: 'Failed to get messages' };
  }
}

export async function markMessageAsRead(
  messageId: string,
  userId: string
): Promise<{ success: boolean }> {
  try {
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        job: {
          select: {
            customerId: true,
            mechanicId: true,
          },
        },
      },
    });

    if (!message) {
      return { success: false };
    }

    const isRecipient =
      userId !== message.senderId &&
      (userId === message.job.customerId || userId === message.job.mechanicId);

    if (!isRecipient) {
      return { success: false };
    }

    await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        isRead: true,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking message as read:', error);
    return { success: false };
  }
}

export async function markJobMessagesAsRead(
  jobId: string,
  userId: string
): Promise<{ success: boolean; count: number }> {
  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        customerId: true,
        mechanicId: true,
      },
    });

    if (!job) {
      return { success: false, count: 0 };
    }

    const isAuthorized = job.customerId === userId || job.mechanicId === userId;
    if (!isAuthorized) {
      return { success: false, count: 0 };
    }

    const result = await prisma.chatMessage.updateMany({
      where: {
        jobId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    return { success: true, count: result.count };
  } catch (error) {
    console.error('Error marking job messages as read:', error);
    return { success: false, count: 0 };
  }
}

export async function getUnreadMessageCount(jobId: string, userId: string): Promise<number> {
  try {
    return await prisma.chatMessage.count({
      where: {
        jobId,
        senderId: { not: userId },
        isRead: false,
      },
    });
  } catch (error) {
    console.error('Error getting unread message count:', error);
    return 0;
  }
}

export async function getTotalUnreadMessageCount(userId: string): Promise<number> {
  try {
    const jobs = await prisma.job.findMany({
      where: {
        OR: [{ customerId: userId }, { mechanicId: userId }],
      },
      select: { id: true },
    });

    return await prisma.chatMessage.count({
      where: {
        jobId: { in: jobs.map((job) => job.id) },
        senderId: { not: userId },
        isRead: false,
      },
    });
  } catch (error) {
    console.error('Error getting total unread count:', error);
    return 0;
  }
}
