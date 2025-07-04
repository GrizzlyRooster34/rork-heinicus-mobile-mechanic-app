import { z } from 'zod';
import { publicProcedure, createTRPCRouter } from '../../create-context';

export const adminRouter = createTRPCRouter({
  getAllUsers: publicProcedure
    .query(async () => {
      // In a real app, this would fetch from database with admin auth check
      console.log('Admin: Getting all users');
      
      // Mock users data
      return {
        users: [
          {
            id: 'admin-cody',
            email: 'matthew.heinen.2014@gmail.com',
            firstName: 'Cody',
            lastName: 'Owner',
            role: 'admin' as const,
            createdAt: new Date(),
            isActive: true,
          },
          {
            id: 'mechanic-cody',
            email: 'cody@heinicus.com',
            firstName: 'Cody',
            lastName: 'Mechanic',
            role: 'mechanic' as const,
            createdAt: new Date(),
            isActive: true,
          },
          {
            id: 'customer-demo',
            email: 'customer@example.com',
            firstName: 'Demo',
            lastName: 'Customer',
            role: 'customer' as const,
            createdAt: new Date(),
            isActive: true,
          }
        ]
      };
    }),

  updateUserRole: publicProcedure
    .input(z.object({
      userId: z.string(),
      role: z.enum(['customer', 'mechanic', 'admin']),
    }))
    .mutation(async ({ input }) => {
      // In a real app, this would update database with admin auth check
      console.log('Admin: Updating user role:', input);
      
      return {
        success: true,
        message: `User role updated to ${input.role}`
      };
    }),

  getSystemStats: publicProcedure
    .query(async () => {
      // In a real app, this would fetch real stats from database
      console.log('Admin: Getting system stats');
      
      return {
        totalUsers: 25,
        totalCustomers: 22,
        totalMechanics: 2,
        totalAdmins: 1,
        totalJobs: 45,
        completedJobs: 38,
        totalRevenue: 12500,
        activeJobs: 7,
      };
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
      // In a real app, this would create user in database with admin auth check
      console.log('Admin: Creating user:', input);
      
      return {
        success: true,
        user: {
          id: `user-${Date.now()}`,
          ...input,
          createdAt: new Date(),
          isActive: true,
        }
      };
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
      // In production, this would upsert to a settings table:
      // await ctx.db.config.upsert({
      //   where: { key: input.key },
      //   update: { value: input.value },
      //   create: { key: input.key, value: input.value }
      // });
      
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
      
      return {
        success: true,
        key: input.key,
        value: input.value,
        message: `Config ${input.key} updated successfully`
      };
    }),
});