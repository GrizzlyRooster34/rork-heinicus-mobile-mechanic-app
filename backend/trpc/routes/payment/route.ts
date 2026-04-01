import { TRPCError } from '@trpc/server';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createPaymentIntent, getJobPayments, syncPaymentStatus } from '@/backend/services/stripe';
import { protectedProcedure, router } from '../../trpc';

const canAccessJobPayments = async (jobId: string, actorId: string, actorRole: UserRole) => {
  if (actorRole === UserRole.ADMIN) {
    return true;
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      customerId: true,
      mechanicId: true,
    },
  });

  if (!job) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Job not found',
    });
  }

  if (job.customerId === actorId || job.mechanicId === actorId) {
    return true;
  }

  throw new TRPCError({
    code: 'FORBIDDEN',
    message: 'You do not have access to these payments',
  });
};

export const paymentRouter = router({
  createPaymentIntent: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
        quoteId: z.string().optional(),
        amount: z.number().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      const job = await prisma.job.findUnique({
        where: { id: input.jobId },
        select: {
          id: true,
          customerId: true,
        },
      });

      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found',
        });
      }

      if (ctx.user.role !== UserRole.ADMIN && ctx.user.id !== job.customerId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the customer for this job can create a payment',
        });
      }

      let amount = input.amount;
      if (input.quoteId) {
        const quote = await prisma.quote.findUnique({
          where: { id: input.quoteId },
          select: {
            id: true,
            jobId: true,
            totalCost: true,
          },
        });

        if (!quote || quote.jobId !== input.jobId) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Quote not found for this job',
          });
        }

        amount = quote.totalCost;
      }

      if (!amount) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Amount is required when quoteId is not provided',
        });
      }

      try {
        return await createPaymentIntent({
          jobId: input.jobId,
          customerId: job.customerId,
          amount,
          quoteId: input.quoteId,
        });
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create payment intent',
        });
      }
    }),

  getJobPayments: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      await canAccessJobPayments(input.jobId, ctx.user.id, ctx.user.role);

      return {
        success: true,
        payments: await getJobPayments(input.jobId),
      };
    }),

  syncPaymentStatus: protectedProcedure
    .input(
      z.object({
        paymentIntentId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      const payment = await prisma.payment.findUnique({
        where: { stripePaymentId: input.paymentIntentId },
        select: {
          jobId: true,
        },
      });

      if (!payment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Payment not found',
        });
      }

      await canAccessJobPayments(payment.jobId, ctx.user.id, ctx.user.role);

      try {
        return await syncPaymentStatus(input.paymentIntentId);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to sync payment status',
        });
      }
    }),
});

// TODO: Add a verified Stripe webhook endpoint after webhook secret handling is reviewed.
