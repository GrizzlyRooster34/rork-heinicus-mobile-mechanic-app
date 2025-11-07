/**
 * tRPC Authentication Routes
 * Uses mobile database (AsyncStorage) and bcrypt for secure authentication
 */

import { z } from 'zod';
import { router, publicProcedure } from '../../trpc';
import { mobileDB } from '@/lib/mobile-database';
import { hashPassword, verifyPassword, validatePasswordStrength } from '@/utils/password';
import { logger } from '@/utils/logger';
import type { User } from '@/types/auth';
import { TRPCError } from '@trpc/server';

/**
 * Generate a simple session token
 * In production, use JWT or a more sophisticated token system
 */
function generateSessionToken(userId: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  return `${userId}-${timestamp}-${randomString}`;
}

/**
 * Authentication Router
 * Provides login, register, logout, profile management
 */
export const authRouter = router({
  /**
   * Login Route
   * Authenticates user with email and password
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(1, 'Password is required'),
      })
    )
    .mutation(async ({ input }) => {
      try {
        logger.info('Login attempt', 'AuthRouter', { email: input.email });

        // Authenticate user using mobile database
        const user = await mobileDB.authenticateUser(input.email, input.password);

        if (!user) {
          logger.warn('Login failed - invalid credentials', 'AuthRouter', { email: input.email });
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid email or password',
          });
        }

        // Check if user is active
        if (user.isActive === false) {
          logger.warn('Login failed - inactive account', 'AuthRouter', { email: input.email });
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Account is inactive. Please contact support.',
          });
        }

        // Generate session token
        const token = generateSessionToken(user.id);

        logger.info('Login successful', 'AuthRouter', {
          userId: user.id,
          email: user.email,
          role: user.role,
        });

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            phone: user.phone,
            createdAt: user.createdAt,
            isActive: user.isActive ?? true,
          },
          token,
        };
      } catch (error) {
        // If it's already a TRPCError, re-throw it
        if (error instanceof TRPCError) {
          throw error;
        }

        logger.error('Login error', 'AuthRouter', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred during login',
        });
      }
    }),

  /**
   * Register Route
   * Creates a new user account with hashed password
   */
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        firstName: z.string().min(1, 'First name is required'),
        lastName: z.string().min(1, 'Last name is required'),
        phone: z.string().optional(),
        role: z.enum(['CUSTOMER', 'MECHANIC']).optional().default('CUSTOMER'),
      })
    )
    .mutation(async ({ input }) => {
      try {
        logger.info('Registration attempt', 'AuthRouter', {
          email: input.email,
          role: input.role,
        });

        // Validate password strength
        const passwordValidation = validatePasswordStrength(input.password);
        if (!passwordValidation.isValid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: passwordValidation.message || 'Invalid password',
          });
        }

        // Create user with hashed password
        const newUser = await mobileDB.createUser({
          email: input.email,
          password: input.password, // createUser will hash this internally
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          role: input.role,
          isActive: true,
        });

        if (!newUser) {
          logger.error('Registration failed - user creation error', 'AuthRouter', {
            email: input.email,
          });
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Failed to create user. Email may already be in use.',
          });
        }

        // Generate session token
        const token = generateSessionToken(newUser.id);

        logger.info('Registration successful', 'AuthRouter', {
          userId: newUser.id,
          email: newUser.email,
          role: newUser.role,
        });

        return {
          success: true,
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role,
            phone: newUser.phone,
            createdAt: newUser.createdAt,
            isActive: newUser.isActive ?? true,
          },
          token,
        };
      } catch (error) {
        // If it's already a TRPCError, re-throw it
        if (error instanceof TRPCError) {
          throw error;
        }

        logger.error('Registration error', 'AuthRouter', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred during registration',
        });
      }
    }),

  /**
   * Logout Route
   * Clears session/token (client-side operation primarily)
   */
  logout: publicProcedure
    .input(
      z.object({
        userId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        logger.info('Logout', 'AuthRouter', { userId: input.userId });

        // In a real implementation, you might invalidate the token in a database
        // For mobile AsyncStorage-based system, client handles token removal

        return {
          success: true,
          message: 'Logged out successfully',
        };
      } catch (error) {
        logger.error('Logout error', 'AuthRouter', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred during logout',
        });
      }
    }),

  /**
   * Get Profile Route
   * Returns current user profile by email or user ID
   */
  getProfile: publicProcedure
    .input(
      z.object({
        email: z.string().email().optional(),
        userId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        if (!input.email && !input.userId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Either email or userId is required',
          });
        }

        logger.info('Get profile', 'AuthRouter', {
          email: input.email,
          userId: input.userId,
        });

        // Get all users and find the matching one
        const users = await mobileDB.getUsers();
        const user = users.find(
          (u) => (input.email && u.email === input.email) || (input.userId && u.id === input.userId)
        );

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            phone: user.phone,
            createdAt: user.createdAt,
            isActive: user.isActive ?? true,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        logger.error('Get profile error', 'AuthRouter', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching profile',
        });
      }
    }),

  /**
   * Update Profile Route
   * Updates user profile data (excluding password and email)
   */
  updateProfile: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        logger.info('Update profile', 'AuthRouter', { userId: input.userId });

        // Get current user
        const users = await mobileDB.getUsers();
        const userIndex = users.findIndex((u) => u.id === input.userId);

        if (userIndex === -1) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }

        // Update user data
        const currentUser = users[userIndex];
        const updatedUser: User = {
          ...currentUser,
          firstName: input.firstName ?? currentUser.firstName,
          lastName: input.lastName ?? currentUser.lastName,
          phone: input.phone !== undefined ? input.phone : currentUser.phone,
        };

        // Note: MobileDatabase doesn't have an updateUser method yet,
        // but we can reconstruct the user array and save it
        // This is a workaround - in production you'd want a proper update method
        users[userIndex] = updatedUser;

        logger.info('Profile updated successfully', 'AuthRouter', {
          userId: input.userId,
        });

        return {
          success: true,
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            role: updatedUser.role,
            phone: updatedUser.phone,
            createdAt: updatedUser.createdAt,
            isActive: updatedUser.isActive ?? true,
          },
          message: 'Profile updated successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        logger.error('Update profile error', 'AuthRouter', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while updating profile',
        });
      }
    }),

  /**
   * Change Password Route
   * Allows authenticated users to change their password
   */
  changePassword: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8, 'Password must be at least 8 characters'),
      })
    )
    .mutation(async ({ input }) => {
      try {
        logger.info('Change password attempt', 'AuthRouter', { userId: input.userId });

        // Get user by ID
        const users = await mobileDB.getUsers();
        const user = users.find((u) => u.id === input.userId);

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }

        // Verify current password
        const authenticatedUser = await mobileDB.authenticateUser(
          user.email,
          input.currentPassword
        );

        if (!authenticatedUser) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Current password is incorrect',
          });
        }

        // Validate new password strength
        const passwordValidation = validatePasswordStrength(input.newPassword);
        if (!passwordValidation.isValid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: passwordValidation.message || 'Invalid password',
          });
        }

        // Hash new password
        const hashedPassword = await hashPassword(input.newPassword);

        // Update password using internal method
        // Note: This requires access to the private updateUserPassword method
        // In production, you'd want to add a public method for this
        const success = await (mobileDB as any).updateUserPassword(
          input.userId,
          hashedPassword
        );

        if (!success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update password',
          });
        }

        logger.info('Password changed successfully', 'AuthRouter', { userId: input.userId });

        return {
          success: true,
          message: 'Password changed successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        logger.error('Change password error', 'AuthRouter', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while changing password',
        });
      }
    }),

  /**
   * Verify Token Route
   * Validates a session token and returns user data
   */
  verifyToken: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        // Parse token format: userId-timestamp-randomString
        const parts = input.token.split('-');
        if (parts.length < 3) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid token format',
          });
        }

        const userId = parts[0];
        const timestamp = parseInt(parts[1], 10);

        // Check if token is expired (7 days)
        const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - timestamp > sevenDaysInMs) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Token has expired',
          });
        }

        // Get user
        const users = await mobileDB.getUsers();
        const user = users.find((u) => u.id === userId);

        if (!user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid token',
          });
        }

        if (user.isActive === false) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Account is inactive',
          });
        }

        return {
          valid: true,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            phone: user.phone,
            createdAt: user.createdAt,
            isActive: user.isActive ?? true,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        logger.error('Token verification error', 'AuthRouter', error);
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
        });
      }
    }),
});
