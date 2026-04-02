import { z } from 'zod';
import { publicProcedure, router } from '../../trpc';
import type { Context } from '../../create-context';
import { prisma } from '../../../../lib/prisma';
import * as jwt from 'jsonwebtoken';

// Use publicProcedure for now since protectedProcedure is the same
const protectedProcedure = publicProcedure;

// Helper function to get user from request
async function getUserFromRequest(req: Request): Promise<{ id: string; role: 'mechanic' | 'admin' | 'customer' } | null> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    
    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || 'default-secret'
    ) as { userId: string; email: string; role: string };
    
    // Find user in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user || !user.isActive) {
      return null;
    }
    
    return {
      id: user.id,
      role: user.role.toLowerCase() as 'mechanic' | 'admin' | 'customer'
    };
  } catch (error) {
    console.error('Error getting user from request:', error);
    return null;
  }
}

export const mechanicRouter = router({
  submitVerification: protectedProcedure
    .input(z.object({
      fullName: z.string().min(2, 'Full name must be at least 2 characters'),
      photoUri: z.string().url('Invalid photo URL'),
      idUri: z.string().url('Invalid ID photo URL'),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await getUserFromRequest(ctx.req);
        
        if (!user) {
          throw new Error('Authentication required');
        }
        
        // Check if user is a mechanic
        if (user.role !== 'mechanic') {
          throw new Error('Only mechanics can submit verification');
        }

        // Get mechanic profile
        const mechanicProfile = await prisma.mechanicProfile.findUnique({
          where: { userId: user.id }
        });

        if (!mechanicProfile) {
          throw new Error('Mechanic profile not found');
        }

        // Check if already submitted
        const existingSubmission = await prisma.mechanicVerification.findFirst({
          where: {
            mechanicId: mechanicProfile.id,
            status: 'PENDING'
          }
        });
        
        if (existingSubmission) {
          throw new Error('Verification already submitted and pending review');
        }

        // Create new verification submission
        const newSubmission = await prisma.mechanicVerification.create({
          data: {
            mechanicId: mechanicProfile.id,
            fullName: input.fullName,
            photoUri: input.photoUri,
            idUri: input.idUri,
            status: 'PENDING'
          }
        });

        // Log the submission for production monitoring
        console.log('Mechanic verification submitted:', {
          verificationId: newSubmission.id,
          userId: user.id,
          mechanicName: input.fullName,
          timestamp: new Date().toISOString(),
        });

        return {
          success: true,
          verificationId: newSubmission.id,
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
    .query(async ({ ctx }) => {
      try {
        const user = await getUserFromRequest(ctx.req);
        
        if (!user || user.role !== 'mechanic') {
          return { verified: false, status: null };
        }

        // Get mechanic profile
        const mechanicProfile = await prisma.mechanicProfile.findUnique({
          where: { userId: user.id }
        });

        if (!mechanicProfile) {
          return { verified: false, status: null };
        }

        // Find the latest verification submission for this user
        const latestSubmission = await prisma.mechanicVerification.findFirst({
          where: { mechanicId: mechanicProfile.id },
          orderBy: { submittedAt: 'desc' }
        });

        if (!latestSubmission) {
          return { verified: false, status: null };
        }

        return {
          verified: latestSubmission.status === 'APPROVED',
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
    .query(async ({ ctx }) => {
      try {
        const user = await getUserFromRequest(ctx.req);
        
        if (!user || user.role !== 'admin') {
          throw new Error('Only admins can view all verifications');
        }

        const verifications = await prisma.mechanicVerification.findMany({
          include: {
            mechanic: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  }
                }
              }
            }
          },
          orderBy: { submittedAt: 'desc' }
        });

        return verifications.map(verification => ({
          id: verification.id,
          userId: verification.mechanic.user.id,
          fullName: verification.fullName,
          status: verification.status,
          submittedAt: verification.submittedAt,
          reviewedAt: verification.reviewedAt,
          reviewedBy: verification.reviewedBy,
          mechanicInfo: {
            firstName: verification.mechanic.user.firstName,
            lastName: verification.mechanic.user.lastName,
            email: verification.mechanic.user.email,
          }
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
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await getUserFromRequest(ctx.req);
        
        if (!user || user.role !== 'admin') {
          throw new Error('Only admins can review verifications');
        }

        const verification = await prisma.mechanicVerification.findUnique({
          where: { id: input.verificationId }
        });

        if (!verification) {
          throw new Error('Verification submission not found');
        }

        // Update the submission
        await prisma.mechanicVerification.update({
          where: { id: input.verificationId },
          data: {
            status: input.status as 'APPROVED' | 'REJECTED',
            reviewedAt: new Date(),
            reviewedBy: user.id,
            reviewNotes: input.reviewNotes,
          }
        });

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
    .query(async ({ ctx, input }) => {
      try {
        const user = await getUserFromRequest(ctx.req);
        
        if (!user || user.role !== 'admin') {
          throw new Error('Only admins can view verification details');
        }

        const verification = await prisma.mechanicVerification.findUnique({
          where: { id: input.verificationId },
          include: {
            mechanic: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  }
                }
              }
            }
          }
        });

        if (!verification) {
          throw new Error('Verification submission not found');
        }

        return {
          id: verification.id,
          fullName: verification.fullName,
          photoUri: verification.photoUri,
          idUri: verification.idUri,
          status: verification.status,
          submittedAt: verification.submittedAt,
          reviewedAt: verification.reviewedAt,
          reviewedBy: verification.reviewedBy,
          reviewNotes: verification.reviewNotes,
          mechanic: verification.mechanic.user,
        };
      } catch (error) {
        console.error('Error in getVerificationDetails:', error);
        throw error;
      }
    }),
});