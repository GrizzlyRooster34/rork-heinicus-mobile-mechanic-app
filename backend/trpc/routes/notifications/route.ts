import { z } from 'zod';
import { publicProcedure, router } from '../../trpc';
import { prisma } from '../../../../lib/prisma';
import { pushNotificationService } from '../../../../lib/notifications/push-service';
import * as jwt from 'jsonwebtoken';

// Helper function to get user from request
async function getUserFromRequest(req: Request): Promise<{ id: string; role: string } | null> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    if (!process.env.NEXTAUTH_SECRET) {
      throw new Error('NEXTAUTH_SECRET environment variable is not set');
    }
    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET
    ) as { userId: string; email: string; role: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.isActive) {
      return null;
    }

    return { id: user.id, role: user.role };
  } catch (error) {
    return null;
  }
}

export const notificationsRouter = router({
  // Get user notifications
  getNotifications: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
      unreadOnly: z.boolean().default(false),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const user = await getUserFromRequest(ctx.req);
        if (!user) {
          throw new Error('Authentication required');
        }

        const whereClause: any = { userId: user.id };
        if (input.unreadOnly) {
          whereClause.read = false;
        }

        const notifications = await prisma.notification.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          take: input.limit,
          skip: input.offset,
        });

        const total = await prisma.notification.count({
          where: whereClause
        });

        const unreadCount = await prisma.notification.count({
          where: {
            userId: user.id,
            read: false,
          }
        });

        return {
          notifications: notifications.map(notification => ({
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            isRead: notification.read,
            isDelivered: notification.isDelivered,
            createdAt: notification.createdAt,
          })),
          total,
          unreadCount,
          hasMore: (input.offset + input.limit) < total,
        };

      } catch (error) {
        console.error('Error getting notifications:', error);
        throw error;
      }
    }),

  // Mark notification as read
  markAsRead: publicProcedure
    .input(z.object({
      notificationId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await getUserFromRequest(ctx.req);
        if (!user) {
          throw new Error('Authentication required');
        }

        await prisma.notification.update({
          where: {
            id: input.notificationId,
            userId: user.id, // Ensure user owns this notification
          },
          data: {
            read: true,
          }
        });

        return { success: true };

      } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }
    }),

  // Mark all notifications as read
  markAllAsRead: publicProcedure
    .mutation(async ({ ctx }) => {
      try {
        const user = await getUserFromRequest(ctx.req);
        if (!user) {
          throw new Error('Authentication required');
        }

        await prisma.notification.updateMany({
          where: {
            userId: user.id,
            read: false,
          },
          data: {
            read: true,
          }
        });

        return { success: true };

      } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
      }
    }),

  // Delete notification
  deleteNotification: publicProcedure
    .input(z.object({
      notificationId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await getUserFromRequest(ctx.req);
        if (!user) {
          throw new Error('Authentication required');
        }

        await prisma.notification.delete({
          where: {
            id: input.notificationId,
            userId: user.id, // Ensure user owns this notification
          }
        });

        return { success: true };

      } catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
      }
    }),

  // Register device token for push notifications
  registerDeviceToken: publicProcedure
    .input(z.object({
      token: z.string(),
      platform: z.enum(['ios', 'android', 'web']),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await getUserFromRequest(ctx.req);
        if (!user) {
          throw new Error('Authentication required');
        }

        // In a real implementation, you would store the device token
        // For now, we'll just log it
        console.log(`Device token registered for user ${user.id}:`, {
          token: input.token,
          platform: input.platform,
        });

        // Subscribe to user-specific topics
        await pushNotificationService.subscribeToTopic([input.token], `user_${user.id}`);
        
        // Subscribe to role-specific topics
        await pushNotificationService.subscribeToTopic([input.token], `role_${user.role.toLowerCase()}`);

        // Subscribe mechanics to emergency alerts
        if (user.role === 'MECHANIC') {
          await pushNotificationService.subscribeToTopic([input.token], 'emergency_mechanics');
        }

        return { success: true };

      } catch (error) {
        console.error('Error registering device token:', error);
        throw error;
      }
    }),

  // Update notification preferences
  updatePreferences: publicProcedure
    .input(z.object({
      jobUpdates: z.boolean().default(true),
      chatMessages: z.boolean().default(true),
      paymentUpdates: z.boolean().default(true),
      promotionalOffers: z.boolean().default(false),
      maintenanceReminders: z.boolean().default(true),
      emergencyAlerts: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await getUserFromRequest(ctx.req);
        if (!user) {
          throw new Error('Authentication required');
        }

        // In a real implementation, you would store these preferences in the database
        // For now, we'll just log them
        console.log(`Notification preferences updated for user ${user.id}:`, input);

        return { success: true, preferences: input };

      } catch (error) {
        console.error('Error updating notification preferences:', error);
        throw error;
      }
    }),

  // Get notification preferences
  getPreferences: publicProcedure
    .query(async ({ ctx }) => {
      try {
        const user = await getUserFromRequest(ctx.req);
        if (!user) {
          throw new Error('Authentication required');
        }

        // Return default preferences (in a real app, get from database)
        return {
          preferences: {
            jobUpdates: true,
            chatMessages: true,
            paymentUpdates: true,
            promotionalOffers: false,
            maintenanceReminders: true,
            emergencyAlerts: user.role === 'MECHANIC',
          }
        };

      } catch (error) {
        console.error('Error getting notification preferences:', error);
        throw error;
      }
    }),

  // Test notification (for development)
  sendTestNotification: publicProcedure
    .input(z.object({
      title: z.string(),
      message: z.string(),
      type: z.enum(['info', 'success', 'warning', 'error']).default('info'),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await getUserFromRequest(ctx.req);
        if (!user) {
          throw new Error('Authentication required');
        }

        // Send test push notification
        const result = await pushNotificationService.sendToUser(user.id, {
          title: input.title,
          body: input.message,
          data: {
            type: 'test_notification',
            testType: input.type,
          },
          clickAction: 'TEST_NOTIFICATION',
        });

        // Save to database
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'SYSTEM_ALERT',
            title: input.title,
            message: input.message,
            data: {
              type: 'test_notification',
              testType: input.type,
            },
            isDelivered: result.success,
          }
        });

        return { 
          success: true, 
          delivered: result.success,
          message: 'Test notification sent'
        };

      } catch (error) {
        console.error('Error sending test notification:', error);
        throw error;
      }
    }),

  // Admin: Send broadcast notification
  sendBroadcast: publicProcedure
    .input(z.object({
      title: z.string(),
      message: z.string(),
      target: z.enum(['all', 'customers', 'mechanics']),
      imageUrl: z.string().optional(),
      deepLink: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await getUserFromRequest(ctx.req);
        if (!user || user.role !== 'ADMIN') {
          throw new Error('Admin access required');
        }

        let topic: string;
        switch (input.target) {
          case 'all':
            topic = 'all_users';
            break;
          case 'customers':
            topic = 'role_customer';
            break;
          case 'mechanics':
            topic = 'role_mechanic';
            break;
          default:
            throw new Error('Invalid target');
        }

        // Send broadcast notification
        const result = await pushNotificationService.sendToTopic(topic, {
          title: input.title,
          body: input.message,
          image: input.imageUrl,
          data: {
            type: 'broadcast',
            target: input.target,
            deepLink: input.deepLink || '',
          },
          clickAction: 'BROADCAST_MESSAGE',
        });

        // Save broadcast record (in a real app, you might want to track this)
        console.log('Broadcast notification sent:', {
          title: input.title,
          target: input.target,
          result: result,
        });

        return { 
          success: result.success,
          messageId: result.messageId,
        };

      } catch (error) {
        console.error('Error sending broadcast notification:', error);
        throw error;
      }
    }),
});