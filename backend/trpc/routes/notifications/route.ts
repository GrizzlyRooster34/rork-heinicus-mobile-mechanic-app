import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  deleteNotification,
  getUnreadNotificationCount,
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  registerPushToken,
  unregisterPushToken,
} from '@/backend/services/notifications';
import { protectedProcedure, router } from '../../trpc';

const platformSchema = z.enum(['ios', 'android', 'web']);

export const notificationsRouter = router({
  register: protectedProcedure
    .input(
      z.object({
        token: z.string().min(1),
        platform: platformSchema,
        deviceId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      const result = await registerPushToken(
        ctx.user.id,
        input.token,
        input.platform,
        input.deviceId
      );

      if (!result.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.error ?? 'Failed to register push token',
        });
      }

      return result;
    }),

  unregister: protectedProcedure
    .input(
      z.object({
        token: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => unregisterPushToken(input.token)),

  listMine: protectedProcedure
    .input(
      z
        .object({
          unreadOnly: z.boolean().optional(),
          limit: z.number().int().min(1).max(100).optional(),
          offset: z.number().int().min(0).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      return {
        notifications: await getUserNotifications(ctx.user.id, input),
      };
    }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    return {
      count: await getUnreadNotificationCount(ctx.user.id),
    };
  }),

  markRead: protectedProcedure
    .input(
      z.object({
        notificationId: z.string(),
      })
    )
    .mutation(async ({ input }) => markNotificationAsRead(input.notificationId)),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    return markAllNotificationsAsRead(ctx.user.id);
  }),

  delete: protectedProcedure
    .input(
      z.object({
        notificationId: z.string(),
      })
    )
    .mutation(async ({ input }) => deleteNotification(input.notificationId)),
});
