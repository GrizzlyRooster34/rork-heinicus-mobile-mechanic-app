import { z } from 'zod';
import { publicProcedure, router } from '../../trpc';
import { prisma } from '@/lib/prisma';
import { QuoteStatus, JobStatus } from '@prisma/client';
import { TRPCError } from '@trpc/server';

export const quoteRouter = router({
  create: publicProcedure
    .input(z.object({
      jobId: z.string().optional(),
      description: z.string(),
      laborCost: z.number(),
      partsCost: z.number(),
      totalCost: z.number(),
      estimatedDuration: z.number(),
      validUntil: z.string().or(z.date()),
      creatorId: z.string(), // In production this would come from ctx.user.id
    }))
    .mutation(async ({ input }) => {
      try {
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
            createdBy: input.creatorId,
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

  listAll: publicProcedure
    .query(async () => {
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

  listMine: publicProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .query(async ({ input }) => {
      // Find quotes created by this user or related to jobs for this user (if customer)
      // For now, simpler implementation: quotes created by user
      const quotes = await prisma.quote.findMany({
        where: {
          createdBy: input.userId,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          job: true
        }
      });
      
      return { quotes };
    }),

  updateStatus: publicProcedure
    .input(z.object({
      quoteId: z.string(),
      status: z.enum(['pending', 'approved', 'declined', 'accepted', 'paid']),
    }))
    .mutation(async ({ input }) => {
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

  approve: publicProcedure
    .input(z.object({
      quoteId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
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
});

// Export with expected name for backward compatibility
export const quoteProcedures = quoteRouter;
