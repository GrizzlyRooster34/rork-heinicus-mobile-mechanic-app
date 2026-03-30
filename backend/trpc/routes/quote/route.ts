import { z } from 'zod';
import { protectedProcedure, router } from '../../trpc';
import { prisma } from '@/lib/prisma';
import { QuoteStatus, JobStatus, UserRole } from '@prisma/client';
import { TRPCError } from '@trpc/server';

const isAdminOrMechanic = (role: UserRole) => role === UserRole.ADMIN || role === UserRole.MECHANIC;

export const quoteRouter = router({
  create: protectedProcedure
    .input(z.object({
      jobId: z.string().optional(),
      description: z.string(),
      laborCost: z.number(),
      partsCost: z.number(),
      totalCost: z.number(),
      estimatedDuration: z.number(),
      validUntil: z.string().or(z.date()),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        if (!ctx.user || !isAdminOrMechanic(ctx.user.role)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only mechanics can create quotes',
          });
        }

        const validUntilDate = typeof input.validUntil === 'string' 
          ? new Date(input.validUntil) 
          : input.validUntil;

        const quote = await prisma.quote.create({
          data: {
            jobId: input.jobId,
            description: input.description,
            laborCost: input.laborCost,
            partsCost: input.partsCost,
            totalCost: input.totalCost,
            estimatedDuration: input.estimatedDuration,
            validUntil: validUntilDate,
            status: QuoteStatus.PENDING,
            createdBy: ctx.user.id,
          },
        });
        
        return { success: true, quote };
      } catch (error) {
        console.error('Quote creation error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create quote',
        });
      }
    }),

  listAll: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user || ctx.user.role !== UserRole.ADMIN) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      const quotes = await prisma.quote.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          job: {
            select: {
              vehicleMake: true,
              vehicleModel: true,
              vehicleYear: true,
            }
          },
          creator: {
            select: {
              firstName: true,
              lastName: true,
            }
          }
        }
      });
      return { quotes };
    }),

  listMine: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
      }

      const quotes = await prisma.quote.findMany({
        where: ctx.user.role === UserRole.CUSTOMER
          ? { job: { customerId: ctx.user.id } }
          : { createdBy: ctx.user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          job: true
        }
      });
      
      return { quotes };
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      quoteId: z.string(),
      status: z.enum(['pending', 'approved', 'declined', 'accepted', 'paid']),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
      }

      if (!isAdminOrMechanic(ctx.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Mechanic access required' });
      }

      const statusMap: Record<string, QuoteStatus> = {
        'pending': QuoteStatus.PENDING,
        'approved': QuoteStatus.APPROVED,
        'declined': QuoteStatus.DECLINED,
        'accepted': QuoteStatus.ACCEPTED,
        'paid': QuoteStatus.PAID,
      };

      try {
        const quote = await prisma.quote.update({
          where: { id: input.quoteId },
          data: {
            status: statusMap[input.status],
          },
        });
        
        return { 
          success: true, 
          message: `Quote status updated to ${input.status}`,
          quote 
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update quote status',
        });
      }
    }),

  approve: protectedProcedure
    .input(z.object({
      quoteId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        if (!ctx.user || !isAdminOrMechanic(ctx.user.role)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Mechanic access required' });
        }

        // Start a transaction to update quote and potentially job
        const result = await prisma.$transaction(async (tx) => {
          // 1. Update quote status
          const quote = await tx.quote.update({
            where: { id: input.quoteId },
            data: { status: QuoteStatus.APPROVED },
          });

          // 2. If linked to a job, update job status and costs
          if (quote.jobId) {
            await tx.job.update({
              where: { id: quote.jobId },
              data: {
                status: JobStatus.ACCEPTED,
                estimatedCost: quote.totalCost,
                partsApproved: true,
                estimatedPartsCost: quote.partsCost,
              },
            });
          }

          return quote;
        });
        
        return { 
          success: true, 
          message: 'Quote approved and job scheduled',
          quote: result
        };
      } catch (error) {
        console.error('Quote approval error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to approve quote',
        });
      }
    }),

  accept: protectedProcedure
    .input(z.object({
      quoteId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
      }

      if (ctx.user.role !== UserRole.CUSTOMER) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Customer access required' });
      }

      const quote = await prisma.quote.findUnique({
        where: { id: input.quoteId },
        include: { job: true },
      });

      if (!quote || !quote.job) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Quote not found' });
      }

      if (quote.job.customerId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      const updated = await prisma.quote.update({
        where: { id: input.quoteId },
        data: { status: QuoteStatus.ACCEPTED },
      });

      if (quote.jobId) {
        await prisma.job.update({
          where: { id: quote.jobId },
          data: { status: JobStatus.ACCEPTED },
        });
      }

      return { success: true, quote: updated };
    }),

  markPaid: protectedProcedure
    .input(z.object({
      quoteId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
      }

      if (ctx.user.role !== UserRole.CUSTOMER) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Customer access required' });
      }

      const quote = await prisma.quote.findUnique({
        where: { id: input.quoteId },
        include: { job: true },
      });

      if (!quote || !quote.job) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Quote not found' });
      }

      if (quote.job.customerId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      const updated = await prisma.quote.update({
        where: { id: input.quoteId },
        data: { status: QuoteStatus.PAID },
      });

      if (quote.jobId) {
        await prisma.job.update({
          where: { id: quote.jobId },
          data: { status: JobStatus.ACCEPTED },
        });
      }

      return { success: true, quote: updated };
    }),

  decline: protectedProcedure
    .input(z.object({
      quoteId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
      }

      if (ctx.user.role !== UserRole.CUSTOMER) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Customer access required' });
      }

      const quote = await prisma.quote.findUnique({
        where: { id: input.quoteId },
        include: { job: true },
      });

      if (!quote || !quote.job) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Quote not found' });
      }

      if (quote.job.customerId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      const updated = await prisma.quote.update({
        where: { id: input.quoteId },
        data: { status: QuoteStatus.DECLINED },
      });

      return { success: true, quote: updated };
    }),
});

// Export with expected name for backward compatibility
export const quoteProcedures = quoteRouter;
