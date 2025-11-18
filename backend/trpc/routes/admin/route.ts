import { z } from 'zod';
import { publicProcedure, createTRPCRouter } from '../../create-context';
import { prisma } from '../../../lib/prisma';

export const adminRouter = createTRPCRouter({
  getAllUsers: publicProcedure
    .query(async () => {
      console.log('Admin: Getting all users');

      try {
        const users = await prisma.user.findMany({
          orderBy: {
            createdAt: 'desc',
          },
        });

        // Map users to frontend format (lowercase roles)
        const mappedUsers = users.map(user => ({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role.toLowerCase() as 'customer' | 'mechanic' | 'admin',
          phone: user.phone,
          createdAt: user.createdAt,
          isActive: user.isActive,
        }));

        return {
          users: mappedUsers
        };
      } catch (error) {
        console.error('Error fetching users:', error);
        return {
          users: []
        };
      }
    }),

  updateUserRole: publicProcedure
    .input(z.object({
      userId: z.string(),
      role: z.enum(['customer', 'mechanic', 'admin']),
    }))
    .mutation(async ({ input }) => {
      console.log('Admin: Updating user role:', input);

      try {
        // Map role to enum format (uppercase)
        const roleMap = {
          'customer': 'CUSTOMER',
          'mechanic': 'MECHANIC',
          'admin': 'ADMIN',
        } as const;

        const updatedUser = await prisma.user.update({
          where: { id: input.userId },
          data: { role: roleMap[input.role] },
        });

        console.log('User role updated successfully:', {
          userId: updatedUser.id,
          newRole: updatedUser.role,
        });

        return {
          success: true,
          message: `User role updated to ${input.role}`
        };
      } catch (error) {
        console.error('Error updating user role:', error);
        return {
          success: false,
          message: 'Failed to update user role'
        };
      }
    }),

  getSystemStats: publicProcedure
    .query(async () => {
      console.log('Admin: Getting system stats');

      try {
        // Get real stats from database
        const totalUsers = await prisma.user.count();
        const totalCustomers = await prisma.user.count({
          where: { role: 'CUSTOMER' }
        });
        const totalMechanics = await prisma.user.count({
          where: { role: 'MECHANIC' }
        });
        const totalAdmins = await prisma.user.count({
          where: { role: 'ADMIN' }
        });

        // TODO: Add job stats when job model is created
        return {
          totalUsers,
          totalCustomers,
          totalMechanics,
          totalAdmins,
          totalJobs: 0,
          completedJobs: 0,
          totalRevenue: 0,
          activeJobs: 0,
        };
      } catch (error) {
        console.error('Error fetching system stats:', error);
        return {
          totalUsers: 0,
          totalCustomers: 0,
          totalMechanics: 0,
          totalAdmins: 0,
          totalJobs: 0,
          completedJobs: 0,
          totalRevenue: 0,
          activeJobs: 0,
        };
      }
    }),

  createUser: publicProcedure
    .input(z.object({
      email: z.string().email(),
      firstName: z.string(),
      lastName: z.string(),
      role: z.enum(['customer', 'mechanic', 'admin']),
      phone: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      console.log('Admin: Creating user:', input);

      try {
        // Map role to enum format (uppercase)
        const roleMap = {
          'customer': 'CUSTOMER',
          'mechanic': 'MECHANIC',
          'admin': 'ADMIN',
        } as const;

        // Generate a default password (should be changed on first login in production)
        const bcrypt = await import('bcrypt');
        const defaultPasswordHash = await bcrypt.hash('ChangeMe123!', 10);

        const newUser = await prisma.user.create({
          data: {
            email: input.email,
            passwordHash: defaultPasswordHash,
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            role: roleMap[input.role],
          },
        });

        console.log('User created successfully:', {
          userId: newUser.id,
          email: newUser.email,
        });

        return {
          success: true,
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: input.role,
            phone: newUser.phone,
            createdAt: newUser.createdAt,
            isActive: newUser.isActive,
          }
        };
      } catch (error) {
        console.error('Error creating user:', error);
        return {
          success: false,
          message: 'Failed to create user'
        };
      }
    }),

  updateSetting: publicProcedure
    .input(z.object({
      key: z.string(),
      value: z.union([z.string(), z.boolean(), z.number(), z.null()]),
    }))
    .mutation(async ({ input }) => {
      // In a real app, this would persist to database with admin auth check
      console.log('Admin: Updating setting:', input);

      // For now, just return success
      // TODO: Create a settings table in Prisma schema and implement persistence

      return {
        success: true,
        key: input.key,
        value: input.value,
        message: `Setting ${input.key} updated successfully`
      };
    }),

  updateConfig: publicProcedure
    .input(z.object({
      key: z.string(),
      value: z.union([z.string(), z.boolean(), z.number(), z.null()]),
    }))
    .mutation(async ({ input }) => {
      // In a real app, this would persist to database with admin auth check
      console.log('Admin: Updating config:', input);

      // TODO: Create a config table in Prisma schema and implement persistence

      return {
        success: true,
        key: input.key,
        value: input.value,
        message: `Config ${input.key} updated successfully`
      };
    }),
});
