import { z } from 'zod';
import { protectedProcedure, router } from '../../trpc';
import { prisma } from '@/lib/prisma';
import { UserRole, JobStatus, QuoteStatus, Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import { requireRole } from '@/backend/middleware/auth';

const adminProcedure = protectedProcedure.use(requireRole(UserRole.ADMIN));

export const adminRouter = router({
  getAllUsers: adminProcedure
    .query(async () => {
      try {
        const users = await prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            createdAt: true,
            isActive: true,
            phone: true,
          }
        });
        return { users };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch users',
        });
      }
    }),

  updateUserRole: adminProcedure
    .input(z.object({
      userId: z.string(),
      role: z.enum(['CUSTOMER', 'MECHANIC', 'ADMIN']),
    }))
    .mutation(async ({ input }) => {
      try {
        await prisma.user.update({
          where: { id: input.userId },
          data: { role: input.role as UserRole },
        });
        
        return {
          success: true,
          message: `User role updated to ${input.role}`
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update user role',
        });
      }
    }),

  getSystemStats: adminProcedure
    .query(async () => {
      try {
        const [
          totalUsers,
          totalCustomers,
          totalMechanics,
          totalAdmins,
          totalJobs,
          completedJobs,
          activeJobs,
          revenueResult
        ] = await Promise.all([
          prisma.user.count(),
          prisma.user.count({ where: { role: UserRole.CUSTOMER } }),
          prisma.user.count({ where: { role: UserRole.MECHANIC } }),
          prisma.user.count({ where: { role: UserRole.ADMIN } }),
          prisma.job.count(),
          prisma.job.count({ where: { status: JobStatus.COMPLETED } }),
          prisma.job.count({ where: { status: { in: [JobStatus.ACCEPTED, JobStatus.IN_PROGRESS] } } }),
          prisma.quote.aggregate({
            where: { status: QuoteStatus.PAID },
            _sum: { totalCost: true }
          })
        ]);

        return {
          totalUsers,
          totalCustomers,
          totalMechanics,
          totalAdmins,
          totalJobs,
          completedJobs,
          activeJobs,
          totalRevenue: revenueResult._sum.totalCost || 0,
        };
      } catch (error) {
        console.error('Stats error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch system stats',
        });
      }
    }),

  createUser: adminProcedure
    .input(z.object({
      email: z.string().email(),
      firstName: z.string(),
      lastName: z.string(),
      role: z.enum(['CUSTOMER', 'MECHANIC', 'ADMIN']),
      phone: z.string().optional(),
      password: z.string().min(6).optional(), // Optional, could generate random if missing
    }))
    .mutation(async ({ input }) => {
      try {
        const tempPassword = input.password || Math.random().toString(36).slice(-8);
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(tempPassword, salt);

        const user = await prisma.user.create({
          data: {
            email: input.email.toLowerCase(),
            firstName: input.firstName,
            lastName: input.lastName,
            role: input.role as UserRole,
            phone: input.phone,
            passwordHash,
            isActive: true,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            createdAt: true,
            isActive: true,
          }
        });
        
        return {
          success: true,
          user,
          tempPassword: input.password ? undefined : tempPassword // Return only if generated
        };
      } catch (error) {
        console.error('Create user error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create user',
        });
      }
    }),

  updateSetting: adminProcedure
    .input(z.object({
      key: z.string(),
      value: z.union([z.string(), z.boolean(), z.number(), z.null()]),
    }))
    .mutation(async ({ input }) => {
      const config = await prisma.systemConfig.upsert({
        where: { key: input.key },
        create: {
          key: input.key,
          value: input.value as Prisma.InputJsonValue,
        },
        update: {
          value: input.value as Prisma.InputJsonValue,
        },
      });

      return {
        success: true,
        key: config.key,
        value: config.value,
        message: `Setting ${input.key} updated successfully`
      };
    }),

  updateConfig: adminProcedure
    .input(z.object({
      key: z.string(),
      value: z.union([z.string(), z.boolean(), z.number(), z.null()]),
    }))
    .mutation(async ({ input }) => {
      const config = await prisma.systemConfig.upsert({
        where: { key: input.key },
        create: {
          key: input.key,
          value: input.value as Prisma.InputJsonValue,
        },
        update: {
          value: input.value as Prisma.InputJsonValue,
        },
      });

      return {
        success: true,
        key: config.key,
        value: config.value,
        message: `Config ${input.key} updated successfully`
      };
    }),
});
