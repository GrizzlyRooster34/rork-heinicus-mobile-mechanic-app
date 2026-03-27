import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { prisma } from '../../lib/prisma';

/**
 * Push Notification Service
 *
 * Handles sending push notifications via Expo Push Notification Service
 * Manages push tokens and notification history
 */

// Create an Expo SDK client
const expo = new Expo();

/**
 * Notification types enum
 */
export type NotificationType =
  | 'JOB_UPDATE'
  | 'NEW_MESSAGE'
  | 'QUOTE_RECEIVED'
  | 'QUOTE_ACCEPTED'
  | 'PAYMENT_RECEIVED'
  | 'JOB_COMPLETED'
  | 'MECHANIC_ASSIGNED'
  | 'MECHANIC_EN_ROUTE';

/**
 * Notification payload interface
 */
export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  type: NotificationType;
  userId: string;
  jobId?: string;
  messageId?: string;
  quoteId?: string;
}

/**
 * Register a push token for a user
 */
export async function registerPushToken(
  userId: string,
  token: string,
  platform: 'ios' | 'android' | 'web',
  deviceId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate Expo push token
    if (!Expo.isExpoPushToken(token)) {
      return {
        success: false,
        error: 'Invalid Expo push token format',
      };
    }

    // Check if token already exists
    const existingToken = await prisma.pushToken.findUnique({
      where: { token },
    });

    if (existingToken) {
      // Update if it's the same user, otherwise it's a duplicate
      if (existingToken.userId === userId) {
        await prisma.pushToken.update({
          where: { token },
          data: {
            platform,
            deviceId,
            updatedAt: new Date(),
          },
        });

        return { success: true };
      } else {
        return {
          success: false,
          error: 'Token already registered to another user',
        };
      }
    }

    // Create new push token
    await prisma.pushToken.create({
      data: {
        userId,
        token,
        platform,
        deviceId,
      },
    });

    console.log(`Push token registered for user ${userId}`);

    return { success: true };
  } catch (error) {
    console.error('Error registering push token:', error);
    return {
      success: false,
      error: 'Failed to register push token',
    };
  }
}

/**
 * Unregister a push token
 */
export async function unregisterPushToken(
  token: string
): Promise<{ success: boolean }> {
  try {
    await prisma.pushToken.delete({
      where: { token },
    });

    console.log(`Push token unregistered: ${token}`);

    return { success: true };
  } catch (error) {
    console.error('Error unregistering push token:', error);
    return { success: false };
  }
}

/**
 * Send a push notification to a single user
 */
export async function sendNotification(
  payload: NotificationPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const { title, body, data, type, userId, jobId, messageId, quoteId } = payload;

    // Get user's push tokens
    const pushTokens = await prisma.pushToken.findMany({
      where: { userId },
      select: { token: true },
    });

    if (pushTokens.length === 0) {
      console.log(`No push tokens found for user ${userId}`);
      return {
        success: false,
        error: 'No push tokens registered for user',
      };
    }

    // Create notification record in database
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        body,
        data: data || {},
        type,
        read: false,
        jobId,
        messageId,
        quoteId,
      },
    });

    // Prepare Expo push messages
    const messages: ExpoPushMessage[] = pushTokens.map((pt) => ({
      to: pt.token,
      sound: 'default',
      title,
      body,
      data: {
        ...data,
        notificationId: notification.id,
        type,
        userId,
        jobId,
        messageId,
        quoteId,
      },
    }));

    // Send push notifications
    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }

    // Check for errors in tickets
    const errors = tickets.filter((ticket) => ticket.status === 'error');
    if (errors.length > 0) {
      console.error('Push notification errors:', errors);
    }

    console.log(`Sent notification to user ${userId}: ${title}`);

    return { success: true };
  } catch (error) {
    console.error('Error sending notification:', error);
    return {
      success: false,
      error: 'Failed to send notification',
    };
  }
}

/**
 * Send notification to multiple users
 */
export async function sendBatchNotifications(
  payloads: NotificationPayload[]
): Promise<{ success: boolean; sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const payload of payloads) {
    const result = await sendNotification(payload);
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { success: true, sent, failed };
}

/**
 * Get user notifications
 */
export async function getUserNotifications(
  userId: string,
  options?: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<any[]> {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(options?.unreadOnly && { read: false }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return notifications;
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean }> {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<{ success: boolean; count: number }> {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return { success: true, count: result.count };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, count: 0 };
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string
): Promise<{ success: boolean }> {
  try {
    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false };
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    return count;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

// ==========================================
// Helper Functions for Common Notifications
// ==========================================

/**
 * Send job update notification
 */
export async function sendJobUpdateNotification(
  userId: string,
  jobId: string,
  status: string
): Promise<void> {
  await sendNotification({
    userId,
    jobId,
    type: 'JOB_UPDATE',
    title: 'Job Status Updated',
    body: `Your job status has been updated to: ${status}`,
    data: { jobId, status },
  });
}

/**
 * Send mechanic assigned notification
 */
export async function sendMechanicAssignedNotification(
  userId: string,
  jobId: string,
  mechanicName: string
): Promise<void> {
  await sendNotification({
    userId,
    jobId,
    type: 'MECHANIC_ASSIGNED',
    title: 'Mechanic Assigned',
    body: `${mechanicName} has been assigned to your job`,
    data: { jobId, mechanicName },
  });
}

/**
 * Send mechanic en route notification
 */
export async function sendMechanicEnRouteNotification(
  userId: string,
  jobId: string,
  eta: number
): Promise<void> {
  await sendNotification({
    userId,
    jobId,
    type: 'MECHANIC_EN_ROUTE',
    title: 'Mechanic On The Way',
    body: `Your mechanic is en route. ETA: ${eta} minutes`,
    data: { jobId, eta },
  });
}

/**
 * Send quote received notification
 */
export async function sendQuoteReceivedNotification(
  userId: string,
  jobId: string,
  quoteId: string,
  amount: number
): Promise<void> {
  await sendNotification({
    userId,
    jobId,
    quoteId,
    type: 'QUOTE_RECEIVED',
    title: 'Quote Received',
    body: `You've received a quote for $${amount.toFixed(2)}`,
    data: { jobId, quoteId, amount },
  });
}

/**
 * Send new message notification
 */
export async function sendNewMessageNotification(
  userId: string,
  jobId: string,
  messageId: string,
  senderName: string,
  preview: string
): Promise<void> {
  await sendNotification({
    userId,
    jobId,
    messageId,
    type: 'NEW_MESSAGE',
    title: `New message from ${senderName}`,
    body: preview,
    data: { jobId, messageId, senderName },
  });
}
