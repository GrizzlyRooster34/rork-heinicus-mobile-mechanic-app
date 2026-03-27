import { prisma } from '../../lib/prisma';
import { sendNewMessageNotification } from './notifications';

/**
 * Messaging Service
 *
 * Handles in-app messaging between customers and mechanics
 */

export interface MessageData {
  jobId: string;
  senderId: string;
  content: string;
  type?: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  mediaUrl?: string;
}

/**
 * Send a message
 */
export async function sendMessage(data: MessageData): Promise<{
  success: boolean;
  message?: any;
  error?: string;
}> {
  try {
    const { jobId, senderId, content, type = 'TEXT', mediaUrl } = data;

    // Verify sender has access to this job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        customerId: true,
        mechanicId: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        mechanic: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!job) {
      return {
        success: false,
        error: 'Job not found',
      };
    }

    // Check if sender is authorized (customer or mechanic)
    const isAuthorized =
      job.customerId === senderId || job.mechanicId === senderId;

    if (!isAuthorized) {
      return {
        success: false,
        error: 'Not authorized to send messages for this job',
      };
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        jobId,
        senderId,
        content,
        type,
        mediaUrl,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Determine recipient
    const recipientId =
      senderId === job.customerId ? job.mechanicId : job.customerId;
    const senderName = `${message.sender.firstName} ${message.sender.lastName}`;
    const messagePreview =
      type === 'TEXT' ? content.substring(0, 50) : `Sent ${type.toLowerCase()}`;

    // Send push notification to recipient
    if (recipientId) {
      await sendNewMessageNotification(
        recipientId,
        jobId,
        message.id,
        senderName,
        messagePreview
      );
    }

    console.log(`Message sent in job ${jobId} by ${senderName}`);

    return {
      success: true,
      message,
    };
  } catch (error) {
    console.error('Error sending message:', error);
    return {
      success: false,
      error: 'Failed to send message',
    };
  }
}

/**
 * Get messages for a job
 */
export async function getJobMessages(
  jobId: string,
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    beforeId?: string;
  }
): Promise<{
  success: boolean;
  messages?: any[];
  error?: string;
}> {
  try {
    // Verify user has access to this job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        customerId: true,
        mechanicId: true,
      },
    });

    if (!job) {
      return {
        success: false,
        error: 'Job not found',
      };
    }

    const isAuthorized =
      job.customerId === userId || job.mechanicId === userId;

    if (!isAuthorized) {
      return {
        success: false,
        error: 'Not authorized to view messages for this job',
      };
    }

    // Build query
    const where: any = { jobId };

    if (options?.beforeId) {
      const beforeMessage = await prisma.message.findUnique({
        where: { id: options.beforeId },
        select: { createdAt: true },
      });

      if (beforeMessage) {
        where.createdAt = {
          lt: beforeMessage.createdAt,
        };
      }
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return {
      success: true,
      messages: messages.reverse(), // Reverse to show oldest first
    };
  } catch (error) {
    console.error('Error getting job messages:', error);
    return {
      success: false,
      error: 'Failed to get messages',
    };
  }
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(
  messageId: string,
  userId: string
): Promise<{ success: boolean }> {
  try {
    const message = await prisma.message.findUnique({
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

    // Only recipient can mark as read
    const isRecipient =
      userId !== message.senderId &&
      (userId === message.job.customerId ||
        userId === message.job.mechanicId);

    if (!isRecipient) {
      return { success: false };
    }

    await prisma.message.update({
      where: { id: messageId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking message as read:', error);
    return { success: false };
  }
}

/**
 * Mark all messages in a job as read
 */
export async function markJobMessagesAsRead(
  jobId: string,
  userId: string
): Promise<{ success: boolean; count: number }> {
  try {
    // Verify user has access to job
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

    const isAuthorized =
      job.customerId === userId || job.mechanicId === userId;

    if (!isAuthorized) {
      return { success: false, count: 0 };
    }

    // Mark all messages not sent by user as read
    const result = await prisma.message.updateMany({
      where: {
        jobId,
        senderId: { not: userId },
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return { success: true, count: result.count };
  } catch (error) {
    console.error('Error marking job messages as read:', error);
    return { success: false, count: 0 };
  }
}

/**
 * Get unread message count for a job
 */
export async function getUnreadMessageCount(
  jobId: string,
  userId: string
): Promise<number> {
  try {
    const count = await prisma.message.count({
      where: {
        jobId,
        senderId: { not: userId },
        read: false,
      },
    });

    return count;
  } catch (error) {
    console.error('Error getting unread message count:', error);
    return 0;
  }
}

/**
 * Get unread message count for all user jobs
 */
export async function getTotalUnreadMessageCount(
  userId: string
): Promise<number> {
  try {
    // Get all jobs where user is customer or mechanic
    const jobs = await prisma.job.findMany({
      where: {
        OR: [{ customerId: userId }, { mechanicId: userId }],
      },
      select: {
        id: true,
      },
    });

    const jobIds = jobs.map((j) => j.id);

    const count = await prisma.message.count({
      where: {
        jobId: { in: jobIds },
        senderId: { not: userId },
        read: false,
      },
    });

    return count;
  } catch (error) {
    console.error('Error getting total unread count:', error);
    return 0;
  }
}

/**
 * Delete a message
 */
export async function deleteMessage(
  messageId: string,
  userId: string
): Promise<{ success: boolean }> {
  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return { success: false };
    }

    // Only sender can delete
    if (message.senderId !== userId) {
      return { success: false };
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting message:', error);
    return { success: false };
  }
}

/**
 * Send system message
 */
export async function sendSystemMessage(
  jobId: string,
  content: string
): Promise<void> {
  try {
    // Get first user (admin) to use as sender for system messages
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    if (!admin) {
      console.error('No admin user found for system message');
      return;
    }

    await prisma.message.create({
      data: {
        jobId,
        senderId: admin.id,
        content,
        type: 'SYSTEM',
      },
    });
  } catch (error) {
    console.error('Error sending system message:', error);
  }
}
