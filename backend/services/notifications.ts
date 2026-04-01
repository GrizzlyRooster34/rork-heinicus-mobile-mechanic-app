import { Expo, type ExpoPushMessage, type ExpoPushTicket } from 'expo-server-sdk';
import { NotificationType, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const expo = new Expo();

type Platform = 'ios' | 'android' | 'web';

export interface NotificationPayload {
  title: string;
  body: string;
  type: NotificationType;
  userId: string;
  data?: Record<string, unknown>;
  jobId?: string;
  messageId?: string;
  quoteId?: string;
}

const toJson = (data?: Record<string, unknown>): Prisma.InputJsonValue | undefined => {
  if (!data) {
    return undefined;
  }

  return data as Prisma.InputJsonValue;
};

export async function registerPushToken(
  userId: string,
  token: string,
  platform: Platform,
  deviceId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!Expo.isExpoPushToken(token)) {
    return {
      success: false,
      error: 'Invalid Expo push token format',
    };
  }

  try {
    const existingToken = await prisma.pushToken.findUnique({
      where: { token },
      select: { userId: true },
    });

    if (existingToken && existingToken.userId !== userId) {
      return {
        success: false,
        error: 'Token is already registered to another user',
      };
    }

    await prisma.pushToken.upsert({
      where: { token },
      create: {
        userId,
        token,
        platform,
        deviceId,
      },
      update: {
        platform,
        deviceId,
        userId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error registering push token:', error);
    return {
      success: false,
      error: 'Failed to register push token',
    };
  }
}

export async function unregisterPushToken(token: string): Promise<{ success: boolean }> {
  try {
    await prisma.pushToken.delete({
      where: { token },
    });

    return { success: true };
  } catch (error) {
    console.error('Error unregistering push token:', error);
    return { success: false };
  }
}

export async function sendNotification(
  payload: NotificationPayload
): Promise<{ success: boolean; delivered: number; error?: string }> {
  const { title, body, data, type, userId, jobId, messageId, quoteId } = payload;

  try {
    const preference = await prisma.notificationPref.findUnique({
      where: { userId },
      select: { push: true },
    });

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        body,
        type,
        data: toJson(data),
        jobId,
        messageId,
        quoteId,
      },
      select: { id: true },
    });

    if (preference && !preference.push) {
      return { success: true, delivered: 0 };
    }

    const pushTokens = await prisma.pushToken.findMany({
      where: { userId },
      select: { token: true },
    });

    if (pushTokens.length === 0) {
      return { success: true, delivered: 0 };
    }

    const messages: ExpoPushMessage[] = pushTokens
      .filter(({ token }) => Expo.isExpoPushToken(token))
      .map(({ token }) => ({
        to: token,
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

    const tickets: ExpoPushTicket[] = [];
    for (const chunk of expo.chunkPushNotifications(messages)) {
      const response = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...response);
    }

    const delivered = tickets.filter((ticket) => ticket.status === 'ok').length;
    return { success: true, delivered };
  } catch (error) {
    console.error('Error sending notification:', error);
    return {
      success: false,
      delivered: 0,
      error: 'Failed to send notification',
    };
  }
}

export async function sendBatchNotifications(
  payloads: NotificationPayload[]
): Promise<{ success: boolean; sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const payload of payloads) {
    const result = await sendNotification(payload);
    if (result.success) {
      sent += 1;
    } else {
      failed += 1;
    }
  }

  return { success: failed === 0, sent, failed };
}

export async function getUserNotifications(
  userId: string,
  options?: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  }
) {
  return prisma.notification.findMany({
    where: {
      userId,
      ...(options?.unreadOnly ? { read: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit ?? 50,
    skip: options?.offset ?? 0,
  });
}

export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean }> {
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

export async function deleteNotification(notificationId: string): Promise<{ success: boolean }> {
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

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    return await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }
}

export async function sendJobUpdateNotification(
  userId: string,
  jobId: string,
  status: string
) {
  return sendNotification({
    userId,
    jobId,
    type: NotificationType.JOB_UPDATE,
    title: 'Job Status Updated',
    body: `Your job status is now ${status}.`,
    data: { jobId, status },
  });
}

export async function sendMechanicAssignedNotification(
  userId: string,
  jobId: string,
  mechanicName: string
) {
  return sendNotification({
    userId,
    jobId,
    type: NotificationType.MECHANIC_ASSIGNED,
    title: 'Mechanic Assigned',
    body: `${mechanicName} has been assigned to your job.`,
    data: { jobId, mechanicName },
  });
}

export async function sendMechanicEnRouteNotification(
  userId: string,
  jobId: string,
  etaMinutes: number
) {
  return sendNotification({
    userId,
    jobId,
    type: NotificationType.MECHANIC_EN_ROUTE,
    title: 'Mechanic On The Way',
    body: `Your mechanic is en route. ETA: ${etaMinutes} minutes.`,
    data: { jobId, etaMinutes },
  });
}

export async function sendQuoteReceivedNotification(
  userId: string,
  jobId: string,
  quoteId: string,
  amount: number
) {
  return sendNotification({
    userId,
    jobId,
    quoteId,
    type: NotificationType.QUOTE_RECEIVED,
    title: 'Quote Received',
    body: `You received a quote for $${amount.toFixed(2)}.`,
    data: { jobId, quoteId, amount },
  });
}

export async function sendNewMessageNotification(
  userId: string,
  jobId: string,
  messageId: string,
  senderName: string,
  preview: string
) {
  return sendNotification({
    userId,
    jobId,
    messageId,
    type: NotificationType.NEW_MESSAGE,
    title: `New message from ${senderName}`,
    body: preview,
    data: { jobId, messageId, senderName },
  });
}
