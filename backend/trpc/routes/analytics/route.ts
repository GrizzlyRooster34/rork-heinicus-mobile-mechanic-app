import { z } from 'zod';
import { publicProcedure, router } from '../../trpc';
import { prisma } from '../../../../lib/prisma';
import { TRPCError } from '@trpc/server';

/**
 * Analytics Router
 * Provides analytics data for mechanics, customers, and admins
 */
export const analyticsRouter = router({
  /**
   * Get mechanic analytics for a specific period
   */
  getMechanicAnalytics: publicProcedure
    .input(z.object({
      mechanicId: z.string(),
      period: z.enum(['week', 'month', 'quarter', 'year']),
    }))
    .query(async ({ input }) => {
      try {
        const now = new Date();
        const periodStart = new Date(now);

        // Calculate date range based on period
        switch (input.period) {
          case 'week':
            periodStart.setDate(periodStart.getDate() - 7);
            break;
          case 'month':
            periodStart.setMonth(periodStart.getMonth() - 1);
            break;
          case 'quarter':
            periodStart.setMonth(periodStart.getMonth() - 3);
            break;
          case 'year':
            periodStart.setFullYear(periodStart.getFullYear() - 1);
            break;
        }

        // Get completed jobs in period
        const completedJobs = await prisma.job.findMany({
          where: {
            mechanicId: input.mechanicId,
            status: 'COMPLETED',
            updatedAt: {
              gte: periodStart,
              lte: now,
            }
          },
          include: {
            quote: {
              include: {
                service: true,
              }
            },
            payments: true,
            reviews: true,
          }
        });

        // Calculate revenue from payments
        const payments = await prisma.payment.findMany({
          where: {
            job: {
              mechanicId: input.mechanicId,
            },
            status: 'succeeded',
            createdAt: {
              gte: periodStart,
              lte: now,
            }
          }
        });

        const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

        // Calculate average job value
        const averageJobValue = completedJobs.length > 0 ? totalRevenue / completedJobs.length : 0;

        // Calculate service type breakdown
        const serviceBreakdown: Record<string, number> = {};
        completedJobs.forEach(job => {
          const category = job.category || job.quote?.service?.category || 'other';
          serviceBreakdown[category] = (serviceBreakdown[category] || 0) + 1;
        });

        // Top services
        const topServices = Object.entries(serviceBreakdown)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([category, count]) => ({ category, count }));

        // Calculate ratings
        const reviews = await prisma.review.findMany({
          where: {
            revieweeId: input.mechanicId,
            isHidden: false,
            createdAt: {
              gte: periodStart,
              lte: now,
            }
          }
        });

        const averageRating = reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
          : 0;

        // Calculate average category ratings
        const avgPunctuality = reviews.length > 0
          ? reviews.reduce((sum, review) => sum + (review.punctualityRating || 0), 0) / reviews.length
          : 0;
        const avgQuality = reviews.length > 0
          ? reviews.reduce((sum, review) => sum + (review.qualityRating || 0), 0) / reviews.length
          : 0;
        const avgCommunication = reviews.length > 0
          ? reviews.reduce((sum, review) => sum + (review.communicationRating || 0), 0) / reviews.length
          : 0;
        const avgValue = reviews.length > 0
          ? reviews.reduce((sum, review) => sum + (review.valueRating || 0), 0) / reviews.length
          : 0;

        // Calculate work time from job timers
        let totalWorkTime = 0;
        completedJobs.forEach(job => {
          const timers = job.timers as any[];
          if (timers && Array.isArray(timers)) {
            timers.forEach(timer => {
              if (timer.action === 'start' && timer.timestamp) {
                // Find corresponding end timer
                const endTimer = timers.find(t =>
                  t.action === 'end' &&
                  new Date(t.timestamp) > new Date(timer.timestamp)
                );
                if (endTimer) {
                  totalWorkTime += new Date(endTimer.timestamp).getTime() - new Date(timer.timestamp).getTime();
                }
              }
            });
          }
        });

        const averageJobTime = completedJobs.length > 0 ? totalWorkTime / completedJobs.length : 0;

        // Calculate revenue breakdown (estimates from job totals)
        let laborRevenue = 0;
        let partsRevenue = 0;
        let feesRevenue = 0;

        completedJobs.forEach(job => {
          const totals = job.totals as any;
          if (totals) {
            laborRevenue += totals.labor || 0;
            partsRevenue += totals.parts || 0;
            feesRevenue += totals.fees || 0;
          }
        });

        return {
          period: input.period,
          dateRange: {
            start: periodStart,
            end: now,
          },
          metrics: {
            totalRevenue,
            completedJobs: completedJobs.length,
            averageJobValue,
            averageJobTime,
            totalWorkTime,
          },
          performance: {
            averageRating,
            totalReviews: reviews.length,
            categoryRatings: {
              punctuality: avgPunctuality,
              quality: avgQuality,
              communication: avgCommunication,
              value: avgValue,
            },
            onTimeRate: 95, // TODO: Calculate actual on-time rate from schedule vs completion
          },
          topServices,
          revenueBreakdown: {
            labor: laborRevenue,
            parts: partsRevenue,
            fees: feesRevenue,
          },
        };
      } catch (error) {
        console.error('Error fetching mechanic analytics:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch mechanic analytics',
        });
      }
    }),

  /**
   * Get customer analytics
   */
  getCustomerAnalytics: publicProcedure
    .input(z.object({
      customerId: z.string(),
      period: z.enum(['week', 'month', 'quarter', 'year']),
    }))
    .query(async ({ input }) => {
      try {
        const now = new Date();
        const periodStart = new Date(now);

        // Calculate date range
        switch (input.period) {
          case 'week':
            periodStart.setDate(periodStart.getDate() - 7);
            break;
          case 'month':
            periodStart.setMonth(periodStart.getMonth() - 1);
            break;
          case 'quarter':
            periodStart.setMonth(periodStart.getMonth() - 3);
            break;
          case 'year':
            periodStart.setFullYear(periodStart.getFullYear() - 1);
            break;
        }

        // Get customer's jobs in period
        const jobs = await prisma.job.findMany({
          where: {
            customerId: input.customerId,
            createdAt: {
              gte: periodStart,
              lte: now,
            }
          },
          include: {
            quote: {
              include: {
                service: true,
              }
            },
            payments: true,
          }
        });

        const completedJobs = jobs.filter(job => job.status === 'COMPLETED');

        // Calculate total spent
        const payments = await prisma.payment.findMany({
          where: {
            job: {
              customerId: input.customerId,
            },
            status: 'succeeded',
            createdAt: {
              gte: periodStart,
              lte: now,
            }
          }
        });

        const totalSpent = payments.reduce((sum, payment) => sum + payment.amount, 0);

        // Service breakdown
        const serviceBreakdown: Record<string, number> = {};
        completedJobs.forEach(job => {
          const category = job.category || job.quote?.service?.category || 'other';
          serviceBreakdown[category] = (serviceBreakdown[category] || 0) + 1;
        });

        const mostUsedServices = Object.entries(serviceBreakdown)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([category, count]) => ({ category, count }));

        return {
          period: input.period,
          dateRange: {
            start: periodStart,
            end: now,
          },
          metrics: {
            totalSpent,
            totalJobs: jobs.length,
            completedJobs: completedJobs.length,
            pendingJobs: jobs.filter(j => j.status === 'PENDING').length,
            activeJobs: jobs.filter(j => j.status === 'ACTIVE').length,
            canceledJobs: jobs.filter(j => j.status === 'CANCELED').length,
          },
          mostUsedServices,
        };
      } catch (error) {
        console.error('Error fetching customer analytics:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch customer analytics',
        });
      }
    }),

  /**
   * Get admin analytics overview
   */
  getAdminAnalytics: publicProcedure
    .input(z.object({
      period: z.enum(['week', 'month', 'quarter', 'year']),
    }))
    .query(async ({ input }) => {
      try {
        const now = new Date();
        const periodStart = new Date(now);

        // Calculate date range
        switch (input.period) {
          case 'week':
            periodStart.setDate(periodStart.getDate() - 7);
            break;
          case 'month':
            periodStart.setMonth(periodStart.getMonth() - 1);
            break;
          case 'quarter':
            periodStart.setMonth(periodStart.getMonth() - 3);
            break;
          case 'year':
            periodStart.setFullYear(periodStart.getFullYear() - 1);
            break;
        }

        // Get all jobs in period
        const jobs = await prisma.job.findMany({
          where: {
            createdAt: {
              gte: periodStart,
              lte: now,
            }
          },
          include: {
            quote: {
              include: {
                service: true,
              }
            },
          }
        });

        // Get all payments in period
        const payments = await prisma.payment.findMany({
          where: {
            status: 'succeeded',
            createdAt: {
              gte: periodStart,
              lte: now,
            }
          }
        });

        const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

        // Get user counts
        const totalCustomers = await prisma.user.count({
          where: { role: 'CUSTOMER', isActive: true }
        });

        const totalMechanics = await prisma.user.count({
          where: { role: 'MECHANIC', isActive: true }
        });

        const newCustomers = await prisma.user.count({
          where: {
            role: 'CUSTOMER',
            isActive: true,
            joinedAt: {
              gte: periodStart,
              lte: now,
            }
          }
        });

        const newMechanics = await prisma.user.count({
          where: {
            role: 'MECHANIC',
            isActive: true,
            joinedAt: {
              gte: periodStart,
              lte: now,
            }
          }
        });

        // Service category breakdown
        const serviceBreakdown: Record<string, number> = {};
        jobs.forEach(job => {
          const category = job.category || job.quote?.service?.category || 'other';
          serviceBreakdown[category] = (serviceBreakdown[category] || 0) + 1;
        });

        const topServices = Object.entries(serviceBreakdown)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([category, count]) => ({ category, count }));

        return {
          period: input.period,
          dateRange: {
            start: periodStart,
            end: now,
          },
          metrics: {
            totalRevenue,
            totalJobs: jobs.length,
            completedJobs: jobs.filter(j => j.status === 'COMPLETED').length,
            activeJobs: jobs.filter(j => j.status === 'ACTIVE').length,
            canceledJobs: jobs.filter(j => j.status === 'CANCELED').length,
            totalCustomers,
            totalMechanics,
            newCustomers,
            newMechanics,
          },
          topServices,
        };
      } catch (error) {
        console.error('Error fetching admin analytics:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch admin analytics',
        });
      }
    }),
});
