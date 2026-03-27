/**
 * Example of how to use the protectedProcedure
 *
 * This example demonstrates:
 * 1. Using protectedProcedure for authenticated routes
 * 2. Accessing ctx.user which contains the decoded JWT payload
 * 3. Type safety for authenticated context
 */

import { z } from 'zod';
import { protectedProcedure, createTRPCRouter, publicProcedure } from '../../create-context';

export const protectedExampleRouter = createTRPCRouter({
  // Example 1: Get current user profile
  // This requires authentication - if no valid JWT is provided, it will throw UNAUTHORIZED
  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      // ctx.user is automatically available and typed as JWTPayload
      // It contains: { userId, email, role?, iat?, exp? }
      return {
        userId: ctx.user.userId,
        email: ctx.user.email,
        role: ctx.user.role,
        message: 'This is your authenticated profile',
      };
    }),

  // Example 2: Update user settings (authenticated mutation)
  updateSettings: protectedProcedure
    .input(z.object({
      notifications: z.boolean().optional(),
      theme: z.enum(['light', 'dark']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Access the authenticated user
      const userId = ctx.user.userId;

      // In a real app, you would update the database here
      console.log(`Updating settings for user ${userId}:`, input);

      return {
        success: true,
        userId,
        updatedSettings: input,
      };
    }),

  // Example 3: Role-based access control
  // This demonstrates how to check user roles within a protected procedure
  adminOnlyAction: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Check if user has admin role
      if (ctx.user.role !== 'admin') {
        throw new Error('This action requires admin privileges');
      }

      return {
        success: true,
        message: 'Admin action completed successfully',
      };
    }),

  // Example 4: Public endpoint for comparison
  // This does NOT require authentication
  publicInfo: publicProcedure
    .query(async () => {
      return {
        message: 'This is public information, no authentication required',
      };
    }),
});

/**
 * USAGE INSTRUCTIONS:
 *
 * To call a protected procedure from the frontend:
 *
 * 1. Include the JWT token in the Authorization header:
 *    headers: {
 *      'Authorization': `Bearer ${yourJwtToken}`
 *    }
 *
 * 2. The middleware will automatically:
 *    - Validate the token
 *    - Decode the JWT payload
 *    - Attach it to ctx.user
 *    - Reject invalid/missing tokens with UNAUTHORIZED error
 *
 * 3. Example tRPC client call:
 *    const profile = await trpc.protectedExample.getProfile.query();
 *    // The token should be included in the HTTP headers by your tRPC client setup
 */
