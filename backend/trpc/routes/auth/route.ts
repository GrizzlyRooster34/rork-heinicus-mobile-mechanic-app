import { z } from 'zod';
import { publicProcedure, router } from '../../trpc';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { TRPCError } from '@trpc/server';
import { 
  generateAccessToken, 
  generateRefreshToken,
  TOKEN_EXPIRATION
} from '@/backend/middleware/auth';
import { UserRole } from '@prisma/client';

export const authRouter = router({
  signup: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      phone: z.string().optional(),
      role: z.enum(['CUSTOMER', 'MECHANIC']).optional().default('CUSTOMER'),
    }))
    .mutation(async ({ input }) => {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: input.email.toLowerCase() },
        });

        if (existingUser) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'An account with this email already exists',
          });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(input.password, salt);

        // Create user
        const user = await prisma.user.create({
          data: {
            email: input.email.toLowerCase(),
            passwordHash,
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            role: input.role as UserRole,
            isActive: true,
          },
        });

        // Generate tokens
        const accessToken = generateAccessToken({
          userId: user.id,
          email: user.email,
          role: user.role,
        });

        const refreshToken = generateRefreshToken(user.id);

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
          },
          token: accessToken,
          refreshToken,
        };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        
        console.error('Signup error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create user account',
        });
      }
    }),

  signin: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Find user
        const user = await prisma.user.findUnique({
          where: { email: input.email.toLowerCase() },
        });

        if (!user || !user.passwordHash) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid email or password',
          });
        }

        // Verify password
        const isValid = await bcrypt.compare(input.password, user.passwordHash);

        if (!isValid) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid email or password',
          });
        }

        // Check if user is active
        if (!user.isActive) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'User account is inactive',
          });
        }

        // Generate tokens
        const accessToken = generateAccessToken({
          userId: user.id,
          email: user.email,
          role: user.role,
        });

        const refreshToken = generateRefreshToken(user.id);

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
          },
          token: accessToken,
          refreshToken,
        };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        
        console.error('Signin error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Authentication failed',
        });
      }
    }),

  verifyToken: publicProcedure
    .input(z.object({
      token: z.string(),
    }))
    .query(async ({ input }) => {
      // The actual verification is usually handled by middleware, 
      // but this endpoint can be used for explicit verification
      try {
        const { verifyToken } = await import('../../middleware/auth');
        const payload = verifyToken(input.token);
        
        // Verify user still exists and is active
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: { id: true, email: true, role: true, isActive: true },
        });

        if (!user || !user.isActive) {
          return { valid: false, error: 'User not found or inactive' };
        }

        return {
          valid: true,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          }
        };
      } catch (error: any) {
        return {
          valid: false,
          error: error.message || 'Invalid token'
        };
      }
    }),
});
