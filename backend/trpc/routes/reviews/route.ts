import { z } from 'zod';
import { publicProcedure, router } from '../../trpc';
import { prisma } from '../../../../lib/prisma';
import * as jwt from 'jsonwebtoken';

// Helper function to get user from request
async function getUserFromRequest(req: Request): Promise<{ id: string; role: string } | null> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || 'default-secret'
    ) as { userId: string; email: string; role: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.isActive) {
      return null;
    }

    return { id: user.id, role: user.role };
  } catch (error) {
    return null;
  }
}

export const reviewsRouter = router({
  // Submit a review
  submitReview: publicProcedure
    .input(z.object({
      jobId: z.string(),
      rating: z.number().min(1).max(5),
      comment: z.string().optional(),
      photos: z.array(z.string()).optional(),
      punctualityRating: z.number().min(1).max(5).optional(),
      qualityRating: z.number().min(1).max(5).optional(),
      communicationRating: z.number().min(1).max(5).optional(),
      valueRating: z.number().min(1).max(5).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await getUserFromRequest(ctx.req);
        if (!user) {
          throw new Error('Authentication required');
        }

        // Get job details
        const job = await prisma.job.findUnique({
          where: { id: input.jobId },
          include: {
            customer: true,
            mechanic: true,
          }
        });

        if (!job) {
          throw new Error('Job not found');
        }

        // Verify job is completed
        if (job.status !== 'COMPLETED') {
          throw new Error('Can only review completed jobs');
        }

        // Determine reviewer and reviewee
        let revieweeId: string;
        if (user.id === job.customerId) {
          // Customer reviewing mechanic
          if (!job.mechanicId) {
            throw new Error('No mechanic assigned to this job');
          }
          revieweeId = job.mechanicId;
        } else if (user.id === job.mechanicId) {
          // Mechanic reviewing customer
          revieweeId = job.customerId;
        } else {
          throw new Error('You are not authorized to review this job');
        }

        // Check if review already exists
        const existingReview = await prisma.review.findFirst({
          where: {
            jobId: input.jobId,
            reviewerId: user.id,
          }
        });

        if (existingReview) {
          throw new Error('You have already reviewed this job');
        }

        // Create review
        const review = await prisma.review.create({
          data: {
            jobId: input.jobId,
            reviewerId: user.id,
            revieweeId: revieweeId,
            rating: input.rating,
            comment: input.comment,
            photos: input.photos || [],
            punctualityRating: input.punctualityRating,
            qualityRating: input.qualityRating,
            communicationRating: input.communicationRating,
            valueRating: input.valueRating,
            isVerified: true, // Mark as verified since it's from a completed job
          },
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              }
            },
            reviewee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              }
            }
          }
        });

        // Update mechanic profile rating if reviewing a mechanic
        if (revieweeId === job.mechanicId) {
          await updateMechanicRating(revieweeId);
        }

        // Create notification for reviewee
        await prisma.notification.create({
          data: {
            userId: revieweeId,
            type: 'REVIEW_REQUEST',
            title: 'New Review',
            message: `You received a ${input.rating}-star review`,
            data: {
              reviewId: review.id,
              jobId: input.jobId,
              rating: input.rating,
            }
          }
        });

        return {
          success: true,
          review: {
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
            reviewer: review.reviewer,
            reviewee: review.reviewee,
          }
        };

      } catch (error) {
        console.error('Error submitting review:', error);
        throw error;
      }
    }),

  // Get reviews for a user (mechanic or customer)
  getUserReviews: publicProcedure
    .input(z.object({
      userId: z.string(),
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
      sortBy: z.enum(['newest', 'oldest', 'rating_high', 'rating_low']).default('newest'),
    }))
    .query(async ({ input }) => {
      try {
        // Build sort order
        let orderBy: any = { createdAt: 'desc' };
        switch (input.sortBy) {
          case 'oldest':
            orderBy = { createdAt: 'asc' };
            break;
          case 'rating_high':
            orderBy = { rating: 'desc' };
            break;
          case 'rating_low':
            orderBy = { rating: 'asc' };
            break;
        }

        const reviews = await prisma.review.findMany({
          where: {
            revieweeId: input.userId,
            isHidden: false,
          },
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              }
            },
            job: {
              select: {
                id: true,
                title: true,
                category: true,
                createdAt: true,
              }
            }
          },
          orderBy,
          take: input.limit,
          skip: input.offset,
        });

        const total = await prisma.review.count({
          where: {
            revieweeId: input.userId,
            isHidden: false,
          }
        });

        // Calculate average ratings
        const ratingStats = await prisma.review.aggregate({
          where: {
            revieweeId: input.userId,
            isHidden: false,
          },
          _avg: {
            rating: true,
            punctualityRating: true,
            qualityRating: true,
            communicationRating: true,
            valueRating: true,
          },
          _count: {
            rating: true,
          }
        });

        return {
          reviews: reviews.map(review => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            photos: review.photos,
            createdAt: review.createdAt,
            isVerified: review.isVerified,
            punctualityRating: review.punctualityRating,
            qualityRating: review.qualityRating,
            communicationRating: review.communicationRating,
            valueRating: review.valueRating,
            reviewer: review.reviewer,
            job: review.job,
          })),
          total,
          hasMore: (input.offset + input.limit) < total,
          stats: {
            averageRating: ratingStats._avg.rating || 0,
            totalReviews: ratingStats._count.rating || 0,
            averagePunctuality: ratingStats._avg.punctualityRating || 0,
            averageQuality: ratingStats._avg.qualityRating || 0,
            averageCommunication: ratingStats._avg.communicationRating || 0,
            averageValue: ratingStats._avg.valueRating || 0,
          }
        };

      } catch (error) {
        console.error('Error getting user reviews:', error);
        throw error;
      }
    }),

  // Get review summary for a mechanic
  getMechanicReviewSummary: publicProcedure
    .input(z.object({
      mechanicId: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const mechanic = await prisma.user.findUnique({
          where: { id: input.mechanicId },
          include: {
            mechanicProfile: true,
          }
        });

        if (!mechanic || !mechanic.mechanicProfile) {
          throw new Error('Mechanic not found');
        }

        // Get rating distribution
        const ratingDistribution = await prisma.review.groupBy({
          by: ['rating'],
          where: {
            revieweeId: input.mechanicId,
            isHidden: false,
          },
          _count: {
            rating: true,
          }
        });

        // Convert to array with all ratings 1-5
        const distribution = Array.from({ length: 5 }, (_, i) => {
          const rating = i + 1;
          const found = ratingDistribution.find(r => r.rating === rating);
          return {
            rating,
            count: found?._count.rating || 0,
          };
        });

        // Get recent reviews
        const recentReviews = await prisma.review.findMany({
          where: {
            revieweeId: input.mechanicId,
            isHidden: false,
          },
          include: {
            reviewer: {
              select: {
                firstName: true,
                lastName: true,
              }
            },
            job: {
              select: {
                title: true,
                category: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });

        return {
          averageRating: mechanic.mechanicProfile.averageRating || 0,
          totalReviews: mechanic.mechanicProfile.totalReviews || 0,
          distribution,
          recentReviews: recentReviews.map(review => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
            reviewer: {
              name: `${review.reviewer.firstName} ${review.reviewer.lastName.charAt(0)}.`
            },
            job: review.job,
          })),
        };

      } catch (error) {
        console.error('Error getting mechanic review summary:', error);
        throw error;
      }
    }),

  // Report a review
  reportReview: publicProcedure
    .input(z.object({
      reviewId: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await getUserFromRequest(ctx.req);
        if (!user) {
          throw new Error('Authentication required');
        }

        const review = await prisma.review.findUnique({
          where: { id: input.reviewId }
        });

        if (!review) {
          throw new Error('Review not found');
        }

        // Increment report count
        await prisma.review.update({
          where: { id: input.reviewId },
          data: {
            reportCount: { increment: 1 }
          }
        });

        // Create notification for admin review
        await prisma.notification.create({
          data: {
            userId: 'admin', // Send to admin
            type: 'SYSTEM_ALERT',
            title: 'Review Reported',
            message: `Review ${input.reviewId} has been reported: ${input.reason}`,
            data: {
              reviewId: input.reviewId,
              reportReason: input.reason,
              reportedBy: user.id,
            }
          }
        });

        return {
          success: true,
          message: 'Review reported successfully'
        };

      } catch (error) {
        console.error('Error reporting review:', error);
        throw error;
      }
    }),

  // Get pending reviews for a user
  getPendingReviews: publicProcedure
    .query(async ({ ctx }) => {
      try {
        const user = await getUserFromRequest(ctx.req);
        if (!user) {
          throw new Error('Authentication required');
        }

        // Find completed jobs that haven't been reviewed yet
        const completedJobs = await prisma.job.findMany({
          where: {
            OR: [
              { customerId: user.id },
              { mechanicId: user.id }
            ],
            status: 'COMPLETED',
            // Check that user hasn't reviewed this job yet
            NOT: {
              reviews: {
                some: {
                  reviewerId: user.id
                }
              }
            }
          },
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            },
            mechanic: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            }
          },
          orderBy: { updatedAt: 'desc' },
          take: 10,
        });

        return {
          pendingReviews: completedJobs.map(job => ({
            jobId: job.id,
            title: job.title,
            category: job.category,
            completedAt: job.updatedAt,
            reviewee: user.id === job.customerId ? job.mechanic : job.customer,
          }))
        };

      } catch (error) {
        console.error('Error getting pending reviews:', error);
        throw error;
      }
    }),

  // Admin: Hide/unhide review
  moderateReview: publicProcedure
    .input(z.object({
      reviewId: z.string(),
      isHidden: z.boolean(),
      moderationNotes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await getUserFromRequest(ctx.req);
        if (!user || user.role !== 'ADMIN') {
          throw new Error('Admin access required');
        }

        await prisma.review.update({
          where: { id: input.reviewId },
          data: {
            isHidden: input.isHidden,
            // Could add moderationNotes field to schema if needed
          }
        });

        // Update mechanic rating if review was hidden/unhidden
        const review = await prisma.review.findUnique({
          where: { id: input.reviewId },
          include: { reviewee: true }
        });

        if (review && review.reviewee.role === 'MECHANIC') {
          await updateMechanicRating(review.revieweeId);
        }

        return {
          success: true,
          message: `Review ${input.isHidden ? 'hidden' : 'unhidden'} successfully`
        };

      } catch (error) {
        console.error('Error moderating review:', error);
        throw error;
      }
    }),
});

// Helper function to update mechanic's average rating
async function updateMechanicRating(mechanicId: string) {
  const ratingStats = await prisma.review.aggregate({
    where: {
      revieweeId: mechanicId,
      isHidden: false,
    },
    _avg: {
      rating: true,
    },
    _count: {
      rating: true,
    }
  });

  await prisma.mechanicProfile.update({
    where: { userId: mechanicId },
    data: {
      averageRating: ratingStats._avg.rating || 0,
      totalReviews: ratingStats._count.rating || 0,
    }
  });
}