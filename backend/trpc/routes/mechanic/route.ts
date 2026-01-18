import { z } from 'zod';
import { publicProcedure, router } from '../../trpc';
import { prisma } from '@/lib/prisma';
import { VerificationStatus, UserRole } from '@prisma/client';
import { TRPCError } from '@trpc/server';

// In a real app, you would use a protectedProcedure that checks ctx.user
// For now, we'll use publicProcedure and check ctx.user manually or assume it's passed
// Since we don't have the full auth context setup in this file, I will adapt.

export const mechanicRouter = router({
  submitVerification: publicProcedure
    .input(z.object({
      userId: z.string(), // In production, get from ctx.user
      fullName: z.string().min(2, 'Full name must be at least 2 characters'),
      photoUri: z.string().url('Invalid photo URL'),
      idUri: z.string().url('Invalid ID photo URL'),
    }))
    .mutation(async ({ input }) => {
      try {
        // Check if user exists and is a mechanic
        const user = await prisma.user.findUnique({
          where: { id: input.userId }
        });

        if (!user) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
        }

        if (user.role !== UserRole.MECHANIC) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only mechanics can submit verification' });
        }

        // Check for pending submission
        const existingSubmission = await prisma.verificationSubmission.findFirst({
          where: {
            userId: input.userId,
            status: VerificationStatus.PENDING
          }
        });
        
        if (existingSubmission) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Verification already submitted and pending review' });
        }

        const submission = await prisma.verificationSubmission.create({
          data: {
            userId: input.userId,
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

  getVerificationStatus: publicProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const latestSubmission = await prisma.verificationSubmission.findFirst({
          where: { userId: input.userId },
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

  getAllVerifications: publicProcedure
    .query(async () => {
      // In production: Check if ctx.user.role === 'ADMIN'
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

  reviewVerification: publicProcedure
    .input(z.object({
      verificationId: z.string(),
      status: z.enum(['APPROVED', 'REJECTED']), // Match Prisma Enum
      reviewNotes: z.string().optional(),
      reviewerId: z.string(), // In production, from ctx.user
    }))
    .mutation(async ({ input }) => {
      try {
        const submission = await prisma.verificationSubmission.update({
          where: { id: input.verificationId },
          data: {
            status: input.status as VerificationStatus,
            reviewedAt: new Date(),
            reviewedBy: input.reviewerId,
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

  getVerificationDetails: publicProcedure
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
