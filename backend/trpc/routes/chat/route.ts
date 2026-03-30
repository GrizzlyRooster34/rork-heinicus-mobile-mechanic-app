import { z } from 'zod';
import { protectedProcedure, router } from '../../trpc';
import { prisma } from '@/lib/prisma';
import { TRPCError } from '@trpc/server';
import { UserRole } from '@prisma/client';

const assertChatAccess = async (jobId: string, userId: string, role: UserRole) => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true, customerId: true, mechanicId: true },
  });

  if (!job) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Job not found',
    });
  }

  if (role === UserRole.CUSTOMER && job.customerId !== userId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Access denied',
    });
  }

  if (role === UserRole.MECHANIC && job.mechanicId && job.mechanicId !== userId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Access denied',
    });
  }
};

export const chatRouter = router({
  listByJob: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      await assertChatAccess(input.jobId, ctx.user.id, ctx.user.role);

      const messages = await prisma.chatMessage.findMany({
        where: { jobId: input.jobId },
        orderBy: { createdAt: 'asc' },
      });

      return { messages };
    }),

  send: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
        message: z.string().trim().min(1).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      await assertChatAccess(input.jobId, ctx.user.id, ctx.user.role);

      const sender = await prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: {
          firstName: true,
          lastName: true,
          role: true,
        },
      });

      if (!sender) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      const senderName = `${sender.firstName} ${sender.lastName}`.trim();
      const message = await prisma.chatMessage.create({
        data: {
          jobId: input.jobId,
          senderId: ctx.user.id,
          senderName,
          senderType: sender.role,
          message: input.message,
        },
      });

      return { success: true, message };
    }),

  markRead: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      await assertChatAccess(input.jobId, ctx.user.id, ctx.user.role);

      const result = await prisma.chatMessage.updateMany({
        where: {
          jobId: input.jobId,
          senderId: { not: ctx.user.id },
          isRead: false,
        },
        data: { isRead: true },
      });

      return { success: true, updatedCount: result.count };
    }),
});
