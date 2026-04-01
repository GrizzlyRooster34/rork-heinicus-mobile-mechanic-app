import { TRPCError } from '@trpc/server';
import { JobStatus, NotificationType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { protectedProcedure, publicProcedure, router } from '../../trpc';

const reviewSortSchema = z.enum(['newest', 'oldest', 'rating_high', 'rating_low']);
const reviewClient = prisma as typeof prisma & { review: any };

export const reviewsRouter = router({
  submitReview: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().optional(),
        photos: z.array(z.string().url()).optional(),
        punctualityRating: z.number().int().min(1).max(5).optional(),
        qualityRating: z.number().int().min(1).max(5).optional(),
        communicationRating: z.number().int().min(1).max(5).optional(),
        valueRating: z.number().int().min(1).max(5).optional(),
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
          status: true,
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

      if (job.status !== JobStatus.COMPLETED) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only completed jobs can be reviewed',
        });
      }

      let revieweeId: string;
      if (ctx.user.id === job.customerId) {
        if (!job.mechanicId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'This job has no assigned mechanic',
          });
        }
        revieweeId = job.mechanicId;
      } else if (ctx.user.id === job.mechanicId) {
        revieweeId = job.customerId;
      } else {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not allowed to review this job',
        });
      }

      try {
        const review = await reviewClient.review.create({
          data: {
            jobId: input.jobId,
            reviewerId: ctx.user.id,
            revieweeId,
            rating: input.rating,
            comment: input.comment,
            photos: input.photos ?? [],
            punctualityRating: input.punctualityRating,
            qualityRating: input.qualityRating,
            communicationRating: input.communicationRating,
            valueRating: input.valueRating,
            isVerified: true,
          },
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
            reviewee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        });

        await prisma.notification.create({
          data: {
            userId: revieweeId,
            type: NotificationType.REVIEW_REQUEST,
            title: 'New Review',
            body: `You received a ${input.rating}-star review.`,
            data: {
              reviewId: review.id,
              jobId: input.jobId,
              rating: input.rating,
            },
            jobId: input.jobId,
          },
        });

        return {
          success: true,
          review,
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes('Unique constraint')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'You have already reviewed this job',
          });
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to submit review',
        });
      }
    }),

  getUserReviews: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
        sortBy: reviewSortSchema.default('newest'),
      })
    )
    .query(async ({ input }) => {
      const orderBy =
        input.sortBy === 'oldest'
          ? { createdAt: 'asc' as const }
          : input.sortBy === 'rating_high'
            ? { rating: 'desc' as const }
            : input.sortBy === 'rating_low'
              ? { rating: 'asc' as const }
              : { createdAt: 'desc' as const };

      const where = {
        revieweeId: input.userId,
        isHidden: false,
      };

      const [reviews, total, stats] = await Promise.all([
        reviewClient.review.findMany({
          where,
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
            job: {
              select: {
                id: true,
                serviceType: true,
                createdAt: true,
              },
            },
          },
          orderBy,
          take: input.limit,
          skip: input.offset,
        }),
        reviewClient.review.count({ where }),
        reviewClient.review.aggregate({
          where,
          _avg: {
            rating: true,
            punctualityRating: true,
            qualityRating: true,
            communicationRating: true,
            valueRating: true,
          },
          _count: {
            rating: true,
          },
        }),
      ]);

      return {
        reviews,
        total,
        hasMore: input.offset + input.limit < total,
        stats: {
          averageRating: stats._avg.rating ?? 0,
          totalReviews: stats._count.rating,
          averagePunctuality: stats._avg.punctualityRating ?? 0,
          averageQuality: stats._avg.qualityRating ?? 0,
          averageCommunication: stats._avg.communicationRating ?? 0,
          averageValue: stats._avg.valueRating ?? 0,
        },
      };
    }),

  getMechanicReviewSummary: publicProcedure
    .input(
      z.object({
        mechanicId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const where = {
        revieweeId: input.mechanicId,
        isHidden: false,
      };

      const [distributionRows, stats, recentReviews] = await Promise.all([
        reviewClient.review.groupBy({
          by: ['rating'],
          where,
          _count: {
            rating: true,
          },
        }),
        reviewClient.review.aggregate({
          where,
          _avg: {
            rating: true,
          },
          _count: {
            rating: true,
          },
        }),
        reviewClient.review.findMany({
          where,
          include: {
            reviewer: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            job: {
              select: {
                serviceType: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        }),
      ]);

      const distribution = Array.from({ length: 5 }, (_, index) => {
        const rating = index + 1;
        const match = distributionRows.find(
          (entry: { rating: number; _count: { rating: number } }) => entry.rating === rating
        );
        return {
          rating,
          count: match?._count.rating ?? 0,
        };
      });

      return {
        averageRating: stats._avg.rating ?? 0,
        totalReviews: stats._count.rating,
        distribution,
        recentReviews,
      };
    }),

  getPendingReviews: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    const jobs = await prisma.job.findMany({
      where: {
        status: JobStatus.COMPLETED,
        OR: [
          { customerId: ctx.user.id },
          { mechanicId: ctx.user.id },
        ],
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        mechanic: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const existingReviews = await reviewClient.review.findMany({
      where: {
        reviewerId: ctx.user.id,
        jobId: {
          in: jobs.map((job) => job.id),
        },
      },
      select: {
        jobId: true,
      },
    });

    const reviewedJobIds = new Set(
      existingReviews.map((review: { jobId: string }) => review.jobId)
    );

    return {
      pendingReviews: jobs
        .filter((job) => !reviewedJobIds.has(job.id))
        .slice(0, 10)
        .map((job) => ({
          jobId: job.id,
          serviceType: job.serviceType,
          completedAt: job.updatedAt,
          reviewee: ctx.user?.id === job.customerId ? job.mechanic : job.customer,
        })),
    };
  }),
});
