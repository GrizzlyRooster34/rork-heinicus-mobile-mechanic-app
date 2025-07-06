import { z } from 'zod';
import { publicProcedure, router } from '../../trpc';
import type { Context } from '../../create-context';

// Use publicProcedure for now since protectedProcedure is the same
const protectedProcedure = publicProcedure;

// Mock storage for verification submissions (in production, this would be a database)
const verificationSubmissions: Array<{
  id: string;
  userId: string;
  fullName: string;
  photoUri: string;
  idUri: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
}> = [];

// Mock user data (in production, this would come from authentication)
const mockUsers: Record<string, { id: string; role: 'mechanic' | 'admin' | 'customer' }> = {
  'mechanic-cody': { id: 'mechanic-cody', role: 'mechanic' },
  'admin-1': { id: 'admin-1', role: 'admin' },
  'customer-1': { id: 'customer-1', role: 'customer' },
};

// Helper function to get user from request (mock implementation)
function getUserFromRequest(req: Request): { id: string; role: 'mechanic' | 'admin' | 'customer' } {
  // In production, this would extract user from JWT token or session
  const userId = req.headers.get('x-user-id') || 'mechanic-cody';
  return mockUsers[userId] || mockUsers['mechanic-cody'];
}

export const mechanicRouter = router({
  submitVerification: protectedProcedure
    .input(z.object({
      fullName: z.string().min(2, 'Full name must be at least 2 characters'),
      photoUri: z.string().url('Invalid photo URL'),
      idUri: z.string().url('Invalid ID photo URL'),
    }))
    .mutation(async ({ ctx, input }: { ctx: Context; input: { fullName: string; photoUri: string; idUri: string } }) => {
      try {
        const user = getUserFromRequest(ctx.req);
        
        // Check if user is a mechanic
        if (user.role !== 'mechanic') {
          throw new Error('Only mechanics can submit verification');
        }

        // Check if already submitted
        const existingSubmission = verificationSubmissions.find(
          sub => sub.userId === user.id && sub.status === 'pending'
        );
        
        if (existingSubmission) {
          throw new Error('Verification already submitted and pending review');
        }

        // Create new verification submission
        const verificationId = `verification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const newSubmission = {
          id: verificationId,
          userId: user.id,
          fullName: input.fullName,
          photoUri: input.photoUri,
          idUri: input.idUri,
          status: 'pending' as const,
          submittedAt: new Date(),
        };

        verificationSubmissions.push(newSubmission);

        // Log the submission for production monitoring
        console.log('Mechanic verification submitted:', {
          verificationId,
          userId: user.id,
          mechanicName: input.fullName,
          timestamp: new Date().toISOString(),
        });

        return {
          success: true,
          verificationId,
          message: 'Verification submitted successfully',
          submission: {
            id: newSubmission.id,
            status: newSubmission.status,
            submittedAt: newSubmission.submittedAt,
          }
        };
      } catch (error) {
        console.error('Error in submitVerification:', error);
        throw error;
      }
    }),

  getVerificationStatus: protectedProcedure
    .query(async ({ ctx }: { ctx: Context }) => {
      try {
        const user = getUserFromRequest(ctx.req);
        
        if (user.role !== 'mechanic') {
          return { verified: false, status: null };
        }

        // For development, return a mock pending status for Cody
        if (user.id === 'mechanic-cody') {
          return {
            verified: false,
            status: 'pending' as const,
            submittedAt: new Date().toISOString(),
            reviewNotes: 'Verification documents under review'
          };
        }

        // Find the latest verification submission for this user
        const latestSubmission = verificationSubmissions
          .filter(sub => sub.userId === user.id)
          .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())[0];

        if (!latestSubmission) {
          return { verified: false, status: null };
        }

        return {
          verified: latestSubmission.status === 'approved',
          status: latestSubmission.status,
          submittedAt: latestSubmission.submittedAt.toISOString(),
          reviewedAt: latestSubmission.reviewedAt?.toISOString(),
          reviewNotes: latestSubmission.reviewNotes,
        };
      } catch (error) {
        console.error('Error in getVerificationStatus:', error);
        // Always return a valid response structure to prevent crashes
        return { 
          verified: false, 
          status: null,
          error: 'Failed to fetch verification status'
        };
      }
    }),

  // Admin-only procedures for managing verifications
  getAllVerifications: protectedProcedure
    .query(async ({ ctx }: { ctx: Context }) => {
      try {
        const user = getUserFromRequest(ctx.req);
        
        if (user.role !== 'admin') {
          throw new Error('Only admins can view all verifications');
        }

        return verificationSubmissions
          .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
          .map(sub => ({
            id: sub.id,
            userId: sub.userId,
            fullName: sub.fullName,
            status: sub.status,
            submittedAt: sub.submittedAt,
            reviewedAt: sub.reviewedAt,
            reviewedBy: sub.reviewedBy,
          }));
      } catch (error) {
        console.error('Error in getAllVerifications:', error);
        throw error;
      }
    }),

  reviewVerification: protectedProcedure
    .input(z.object({
      verificationId: z.string(),
      status: z.enum(['approved', 'rejected']),
      reviewNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }: { ctx: Context; input: { verificationId: string; status: 'approved' | 'rejected'; reviewNotes?: string } }) => {
      try {
        const user = getUserFromRequest(ctx.req);
        
        if (user.role !== 'admin') {
          throw new Error('Only admins can review verifications');
        }

        const submissionIndex = verificationSubmissions.findIndex(
          sub => sub.id === input.verificationId
        );

        if (submissionIndex === -1) {
          throw new Error('Verification submission not found');
        }

        // Update the submission
        verificationSubmissions[submissionIndex] = {
          ...verificationSubmissions[submissionIndex],
          status: input.status,
          reviewedAt: new Date(),
          reviewedBy: user.id,
          reviewNotes: input.reviewNotes,
        };

        // Log the review for production monitoring
        console.log('Mechanic verification reviewed:', {
          verificationId: input.verificationId,
          status: input.status,
          reviewedBy: user.id,
          timestamp: new Date().toISOString(),
        });

        return {
          success: true,
          message: `Verification ${input.status} successfully`,
        };
      } catch (error) {
        console.error('Error in reviewVerification:', error);
        throw error;
      }
    }),

  getVerificationDetails: protectedProcedure
    .input(z.object({
      verificationId: z.string(),
    }))
    .query(async ({ ctx, input }: { ctx: Context; input: { verificationId: string } }) => {
      try {
        const user = getUserFromRequest(ctx.req);
        
        if (user.role !== 'admin') {
          throw new Error('Only admins can view verification details');
        }

        const submission = verificationSubmissions.find(
          sub => sub.id === input.verificationId
        );

        if (!submission) {
          throw new Error('Verification submission not found');
        }

        return submission;
      } catch (error) {
        console.error('Error in getVerificationDetails:', error);
        throw error;
      }
    }),
});