import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../../create-router';
import {
  sendMessage,
  getJobMessages,
  markMessageAsRead,
  markJobMessagesAsRead,
  getUnreadMessageCount,
  getTotalUnreadMessageCount,
  deleteMessage,
  sendSystemMessage,
} from '../../../services/messaging';

/**
 * Messages tRPC Router
 *
 * Handles messaging between customers and mechanics
 */

export const messagesRouter = createTRPCRouter({
  /**
   * Send a message
   */
  sendMessage: publicProcedure
    .input(
      z.object({
        jobId: z.string(),
        senderId: z.string(),
        content: z.string().min(1),
        type: z.enum(['TEXT', 'IMAGE', 'FILE', 'SYSTEM']).optional(),
        mediaUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await sendMessage(input);
      return result;
    }),

  /**
   * Get messages for a job
   */
  getJobMessages: publicProcedure
    .input(
      z.object({
        jobId: z.string(),
        userId: z.string(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
        beforeId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const result = await getJobMessages(input.jobId, input.userId, {
        limit: input.limit,
        offset: input.offset,
        beforeId: input.beforeId,
      });

      return result;
    }),

  /**
   * Mark message as read
   */
  markAsRead: publicProcedure
    .input(
      z.object({
        messageId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await markMessageAsRead(input.messageId, input.userId);
      return result;
    }),

  /**
   * Mark all job messages as read
   */
  markJobMessagesAsRead: publicProcedure
    .input(
      z.object({
        jobId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await markJobMessagesAsRead(input.jobId, input.userId);
      return result;
    }),

  /**
   * Get unread message count for a job
   */
  getUnreadCount: publicProcedure
    .input(
      z.object({
        jobId: z.string(),
        userId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const count = await getUnreadMessageCount(input.jobId, input.userId);

      return {
        success: true,
        count,
      };
    }),

  /**
   * Get total unread message count for user
   */
  getTotalUnreadCount: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const count = await getTotalUnreadMessageCount(input.userId);

      return {
        success: true,
        count,
      };
    }),

  /**
   * Delete a message
   */
  deleteMessage: publicProcedure
    .input(
      z.object({
        messageId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await deleteMessage(input.messageId, input.userId);
      return result;
    }),

  /**
   * Send system message (admin only)
   */
  sendSystemMessage: publicProcedure
    .input(
      z.object({
        jobId: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await sendSystemMessage(input.jobId, input.content);

      return {
        success: true,
      };
    }),
});
