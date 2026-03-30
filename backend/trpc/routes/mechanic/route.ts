import { z } from 'zod';
import { protectedProcedure, router } from '../../trpc';
import { prisma } from '@/lib/prisma';
import { VerificationStatus, UserRole } from '@prisma/client';
import { TRPCError } from '@trpc/server';

const mechanicProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }
  if (ctx.user.role !== UserRole.MECHANIC) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Mechanic role required' });
  }
  return next();
});

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }
  if (ctx.user.role !== UserRole.ADMIN) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin role required' });
  }
  return next();
});

export const mechanicRouter = router({
  submitVerification: mechanicProcedure
    .input(z.object({
      fullName: z.string().min(2, 'Full name must be at least 2 characters'),
      photoUri: z.string().url('Invalid photo URL'),
      idUri: z.string().url('Invalid ID photo URL'),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.user?.id;
        if (!userId) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
        }

        // Check for pending submission
        const existingSubmission = await prisma.verificationSubmission.findFirst({
          where: {
            userId,
            status: VerificationStatus.PENDING
          }
        });
        
        if (existingSubmission) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Verification already submitted and pending review' });
        }

        const submission = await prisma.verificationSubmission.create({
          data: {
            userId,
            fullName: input.fullName,
            photoUri: input.photoUri,
            idUri: input.idUri,
            status: VerificationStatus.PENDING,
          }
        });

        return {
          success: true,
          verificationId: submission.id,
          message: 'Verification submitted successfully',
          submission
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Error in submitVerification:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to submit verification' });
      }
    }),

  getVerificationStatus: mechanicProcedure
    .query(async ({ ctx }) => {
      try {
        const userId = ctx.user?.id;
        if (!userId) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
        }

        const latestSubmission = await prisma.verificationSubmission.findFirst({
          where: { userId },
          orderBy: { submittedAt: 'desc' }
        });

        if (!latestSubmission) {
          return { verified: false, status: null };
        }

        return {
          verified: latestSubmission.status === VerificationStatus.APPROVED,
          status: latestSubmission.status,
          submittedAt: latestSubmission.submittedAt.toISOString(),
          reviewedAt: latestSubmission.reviewedAt?.toISOString(),
          reviewNotes: latestSubmission.reviewNotes,
        };
      } catch (error) {
        console.error('Error in getVerificationStatus:', error);
        return { 
          verified: false, 
          status: null,
          error: 'Failed to fetch verification status'
        };
      }
    }),

  getAllVerifications: adminProcedure
    .query(async () => {
      try {
        const submissions = await prisma.verificationSubmission.findMany({
          orderBy: { submittedAt: 'desc' },
          include: {
            user: {
              select: { email: true }
            }
          }
        });

        return submissions.map(sub => ({
          id: sub.id,
          userId: sub.userId,
          fullName: sub.fullName,
          email: sub.user.email,
          status: sub.status,
          submittedAt: sub.submittedAt,
          reviewedAt: sub.reviewedAt,
          reviewedBy: sub.reviewedBy,
        }));
      } catch (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch verifications' });
      }
    }),

  reviewVerification: adminProcedure
    .input(z.object({
      verificationId: z.string(),
      status: z.enum(['APPROVED', 'REJECTED']), // Match Prisma Enum
      reviewNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.user?.id;
        if (!userId) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
        }

        const submission = await prisma.verificationSubmission.update({
          where: { id: input.verificationId },
          data: {
            status: input.status as VerificationStatus,
            reviewedAt: new Date(),
            reviewedBy: userId,
            reviewNotes: input.reviewNotes,
          }
        });

        return {
          success: true,
          message: `Verification ${input.status} successfully`,
          submission
        };
      } catch (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to review verification' });
      }
    }),

  getVerificationDetails: adminProcedure
    .input(z.object({
      verificationId: z.string(),
    }))
    .query(async ({ input }) => {
      const submission = await prisma.verificationSubmission.findUnique({
        where: { id: input.verificationId },
        include: {
          user: {
            select: { email: true, phone: true }
          }
        }
      });

      if (!submission) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Verification submission not found' });
      }

      return submission;
    }),
});
