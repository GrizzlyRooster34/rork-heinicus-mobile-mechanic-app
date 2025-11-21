import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../../create-router';
import {
  registerPushToken,
  unregisterPushToken,
  sendNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
  type NotificationPayload,
} from '../../../services/notifications';

/**
 * Notifications tRPC Router
 *
 * Handles push notification registration and management
 */

export const notificationsRouter = createTRPCRouter({
  /**
   * Register push token for a user
   */
  registerToken: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        token: z.string(),
        platform: z.enum(['ios', 'android', 'web']),
        deviceId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await registerPushToken(
        input.userId,
        input.token,
        input.platform,
        input.deviceId
      );

      return result;
    }),

  /**
   * Unregister push token
   */
  unregisterToken: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await unregisterPushToken(input.token);
      return result;
    }),

  /**
   * Send a notification to a user
   */
  sendNotification: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        title: z.string(),
        body: z.string(),
        type: z.enum([
          'JOB_UPDATE',
          'NEW_MESSAGE',
          'QUOTE_RECEIVED',
          'QUOTE_ACCEPTED',
          'PAYMENT_RECEIVED',
          'JOB_COMPLETED',
          'MECHANIC_ASSIGNED',
          'MECHANIC_EN_ROUTE',
        ]),
        data: z.record(z.any()).optional(),
        jobId: z.string().optional(),
        messageId: z.string().optional(),
        quoteId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const payload: NotificationPayload = {
        userId: input.userId,
        title: input.title,
        body: input.body,
        type: input.type as any,
        data: input.data,
        jobId: input.jobId,
        messageId: input.messageId,
        quoteId: input.quoteId,
      };

      const result = await sendNotification(payload);
      return result;
    }),

  /**
   * Get user notifications
   */
  getNotifications: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        unreadOnly: z.boolean().optional(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      })
    )
    .query(async ({ input }) => {
      const notifications = await getUserNotifications(input.userId, {
        unreadOnly: input.unreadOnly,
        limit: input.limit,
        offset: input.offset,
      });

      return {
        success: true,
        notifications,
      };
    }),

  /**
   * Mark notification as read
   */
  markAsRead: publicProcedure
    .input(
      z.object({
        notificationId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await markNotificationAsRead(input.notificationId);
      return result;
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await markAllNotificationsAsRead(input.userId);
      return result;
    }),

  /**
   * Delete a notification
   */
  deleteNotification: publicProcedure
    .input(
      z.object({
        notificationId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await deleteNotification(input.notificationId);
      return result;
    }),

  /**
   * Get unread notification count
   */
  getUnreadCount: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const count = await getUnreadCount(input.userId);

      return {
        success: true,
        count,
      };
    }),

  /**
   * Test notification (development only)
   */
  sendTestNotification: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        title: z.string().optional(),
        body: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const payload: NotificationPayload = {
        userId: input.userId,
        title: input.title || 'Test Notification',
        body: input.body || 'This is a test notification from Heinicus Mobile Mechanic',
        type: 'JOB_UPDATE',
        data: { test: true, timestamp: new Date().toISOString() },
      };

      const result = await sendNotification(payload);
      return result;
    }),
});
