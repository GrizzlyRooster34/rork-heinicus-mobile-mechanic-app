import { z } from 'zod';
import { publicProcedure, router } from '../../trpc';
import { prisma } from '../../../../lib/prisma';
import { TRPCError } from '@trpc/server';
import * as jwt from 'jsonwebtoken';
import { hashPassword } from '@/utils/password';

// Helper function to get user from request
async function getUserFromRequest(req: Request): Promise<{ id: string; role: string } | null> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    if (!process.env.NEXTAUTH_SECRET) {
      throw new Error('NEXTAUTH_SECRET environment variable is not set');
    }
    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET
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

/**
 * Admin Router
 * Handles admin-only operations like user management, system stats, and settings
 */
export const adminRouter = router({
  /**
   * Get all users with optional filtering
   */
  getAllUsers: publicProcedure
    .input(z.object({
      role: z.enum(['CUSTOMER', 'MECHANIC', 'ADMIN']).optional(),
      isActive: z.boolean().optional(),
      search: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      try {
        const user = await getUserFromRequest(ctx.req);

        if (!user || user.role !== 'ADMIN') {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Admin access required',
          });
        }

        const where: any = {};

        if (input?.role) {
          where.role = input.role;
        }

        if (input?.isActive !== undefined) {
          where.isActive = input.isActive;
        }

        if (input?.search) {
          where.OR = [
            { email: { contains: input.search, mode: 'insensitive' } },
            { firstName: { contains: input.search, mode: 'insensitive' } },
            { lastName: { contains: input.search, mode: 'insensitive' } },
          ];
        }

        const users = await prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            address: true,
            role: true,
            isActive: true,
            joinedAt: true,
            mechanicProfile: {
              select: {
                rating: true,
                totalJobs: true,
                averageRating: true,
                totalReviews: true,
                yearsExperience: true,
                specialties: true,
              }
            },
          },
          orderBy: {
            joinedAt: 'desc',
          },
          take: input?.limit || 50,
          skip: input?.offset || 0,
        });

        const total = await prisma.user.count({ where });

        return {
          users,
          total,
          hasMore: (input?.offset || 0) + users.length < total,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error fetching users:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch users',
        });
      }
    }),

  /**
   * Get a single user by ID (detailed view)
   */
  getUserById: publicProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const user = await getUserFromRequest(ctx.req);

        if (!user || user.role !== 'ADMIN') {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Admin access required',
          });
        }

        const targetUser = await prisma.user.findUnique({
          where: { id: input.userId },
          include: {
            vehicles: true,
            mechanicProfile: true,
            mechanicVerification: true,
            pricingProfile: true,
            availability: true,
            notificationPrefs: true,
            jobsAsCustomer: {
              include: {
                quote: {
                  include: {
                    service: true,
                  }
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 10,
            },
            jobsAsMechanic: {
              include: {
                quote: {
                  include: {
                    service: true,
                  }
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 10,
            },
            reviewsWritten: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 5,
            },
            reviewsReceived: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 5,
            },
          },
        });

        if (!targetUser) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }

        return { user: targetUser };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error fetching user:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user',
        });
      }
    }),

  /**
   * Update user role
   */
  updateUserRole: publicProcedure
    .input(z.object({
      userId: z.string(),
      role: z.enum(['CUSTOMER', 'MECHANIC', 'ADMIN']),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await getUserFromRequest(ctx.req);

        if (!user || user.role !== 'ADMIN') {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Admin access required',
          });
        }

        const updatedUser = await prisma.user.update({
          where: { id: input.userId },
          data: {
            role: input.role,
          },
        });

        // If changing to mechanic, create mechanic profile if it doesn't exist
        if (input.role === 'MECHANIC') {
          const existingProfile = await prisma.mechanicProfile.findUnique({
            where: { mechanicId: input.userId }
          });

          if (!existingProfile) {
            await prisma.mechanicProfile.create({
              data: {
                mechanicId: input.userId,
                rating: 0,
                totalJobs: 0,
                averageRating: 0,
                totalReviews: 0,
              }
            });
          }
        }

        console.log('User role updated:', input.userId, input.role);

        return {
          success: true,
          user: updatedUser,
          message: `User role updated to ${input.role}`,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error updating user role:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update user role',
        });
      }
    }),

  /**
   * Update user active status
   */
  updateUserStatus: publicProcedure
    .input(z.object({
      userId: z.string(),
      isActive: z.boolean(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await getUserFromRequest(ctx.req);

        if (!user || user.role !== 'ADMIN') {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Admin access required',
          });
        }

        const updatedUser = await prisma.user.update({
          where: { id: input.userId },
          data: {
            isActive: input.isActive,
          },
        });

        console.log('User status updated:', input.userId, input.isActive);

        return {
          success: true,
          user: updatedUser,
          message: `User ${input.isActive ? 'activated' : 'deactivated'} successfully`,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error updating user status:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update user status',
        });
      }
    }),

  /**
   * Create new user (admin function)
   */
  createUser: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      role: z.enum(['CUSTOMER', 'MECHANIC', 'ADMIN']),
      phone: z.string().optional(),
      address: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await getUserFromRequest(ctx.req);

        if (!user || user.role !== 'ADMIN') {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Admin access required',
          });
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: input.email }
        });

        if (existingUser) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email already in use',
          });
        }

        // Hash password
        const hashedPassword = await hashPassword(input.password);

        // Create user
        const newUser = await prisma.user.create({
          data: {
            email: input.email,
            firstName: input.firstName,
            lastName: input.lastName,
            role: input.role,
            phone: input.phone,
            address: input.address,
            isActive: true,
          },
        });

        // If mechanic, create mechanic profile
        if (input.role === 'MECHANIC') {
          await prisma.mechanicProfile.create({
            data: {
              mechanicId: newUser.id,
              rating: 0,
              totalJobs: 0,
              averageRating: 0,
              totalReviews: 0,
            }
          });
        }

        console.log('User created by admin:', newUser.id, newUser.email);

        return {
          success: true,
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role,
            isActive: newUser.isActive,
            joinedAt: newUser.joinedAt,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error creating user:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create user',
        });
      }
    }),

  /**
   * Delete user (soft delete by deactivating)
   */
  deleteUser: publicProcedure
    .input(z.object({
      userId: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await getUserFromRequest(ctx.req);

        if (!user || user.role !== 'ADMIN') {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Admin access required',
          });
        }

        // Soft delete by deactivating
        await prisma.user.update({
          where: { id: input.userId },
          data: {
            isActive: false,
          },
        });

        console.log('User deleted (deactivated):', input.userId, input.reason);

        return {
          success: true,
          message: 'User deactivated successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error deleting user:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete user',
        });
      }
    }),

  /**
   * Get system statistics
   */
  getSystemStats: publicProcedure
    .query(async ({ ctx }) => {
      try {
        const user = await getUserFromRequest(ctx.req);

        if (!user || user.role !== 'ADMIN') {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Admin access required',
          });
        }

        // Get user counts
        const totalUsers = await prisma.user.count();
        const totalCustomers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
        const totalMechanics = await prisma.user.count({ where: { role: 'MECHANIC' } });
        const totalAdmins = await prisma.user.count({ where: { role: 'ADMIN' } });
        const activeUsers = await prisma.user.count({ where: { isActive: true } });

        // Get job counts
        const totalJobs = await prisma.job.count();
        const completedJobs = await prisma.job.count({ where: { status: 'COMPLETED' } });
        const activeJobs = await prisma.job.count({ where: { status: 'ACTIVE' } });
        const pendingJobs = await prisma.job.count({ where: { status: 'PENDING' } });

        // Get quote counts
        const totalQuotes = await prisma.quote.count();
        const pendingQuotes = await prisma.quote.count({ where: { status: 'PENDING' } });
        const acceptedQuotes = await prisma.quote.count({ where: { status: 'ACCEPTED' } });

        // Get payment stats
        const paymentStats = await prisma.payment.aggregate({
          _sum: {
            amount: true,
          },
          where: {
            status: 'succeeded',
          },
        });

        const totalRevenue = paymentStats._sum.amount || 0;

        // Get review stats
        const totalReviews = await prisma.review.count();
        const averageRatingStats = await prisma.review.aggregate({
          _avg: {
            rating: true,
          },
        });

        // Get recent activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const newUsersLast30Days = await prisma.user.count({
          where: {
            joinedAt: {
              gte: thirtyDaysAgo,
            },
          },
        });

        const jobsLast30Days = await prisma.job.count({
          where: {
            createdAt: {
              gte: thirtyDaysAgo,
            },
          },
        });

        return {
          users: {
            total: totalUsers,
            customers: totalCustomers,
            mechanics: totalMechanics,
            admins: totalAdmins,
            active: activeUsers,
            newLast30Days: newUsersLast30Days,
          },
          jobs: {
            total: totalJobs,
            completed: completedJobs,
            active: activeJobs,
            pending: pendingJobs,
            last30Days: jobsLast30Days,
          },
          quotes: {
            total: totalQuotes,
            pending: pendingQuotes,
            accepted: acceptedQuotes,
          },
          payments: {
            totalRevenue,
            totalTransactions: await prisma.payment.count(),
          },
          reviews: {
            total: totalReviews,
            averageRating: averageRatingStats._avg.rating || 0,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error fetching system stats:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch system stats',
        });
      }
    }),

  /**
   * Update system setting (configuration)
   */
  updateSetting: publicProcedure
    .input(z.object({
      key: z.string(),
      value: z.union([z.string(), z.boolean(), z.number(), z.null()]),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await getUserFromRequest(ctx.req);

        if (!user || user.role !== 'ADMIN') {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Admin access required',
          });
        }

        // TODO: Implement system settings table
        // For now, just log the setting change
        console.log('System setting updated:', input.key, input.value);

        return {
          success: true,
          key: input.key,
          value: input.value,
          message: `Setting ${input.key} updated successfully`,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error updating setting:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update setting',
        });
      }
    }),

  /**
   * Update configuration (alias for updateSetting)
   */
  updateConfig: publicProcedure
    .input(z.object({
      key: z.string(),
      value: z.union([z.string(), z.boolean(), z.number(), z.null()]),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await getUserFromRequest(ctx.req);

        if (!user || user.role !== 'ADMIN') {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Admin access required',
          });
        }

        // TODO: Implement system config table
        console.log('System config updated:', input.key, input.value);

        return {
          success: true,
          key: input.key,
          value: input.value,
          message: `Config ${input.key} updated successfully`,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error updating config:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update config',
        });
      }
    }),
});
