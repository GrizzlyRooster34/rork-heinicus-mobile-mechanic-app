import { z } from 'zod';
import { publicProcedure, createTRPCRouter } from '../../create-context';
import { prisma } from '../../../../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'heinicus-mobile-mechanic-app-jwt-secret-key-2025-very-secure-and-long-at-least-64-chars';
const JWT_EXPIRES_IN = '7d'; // 7 days

// Helper function to generate JWT token
function generateToken(user: { id: string; email: string; role: string }) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Helper function to verify JWT token
function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
  } catch (error) {
    return null;
  }
}

export const authRouter = createTRPCRouter({
  signup: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      phone: z.string().optional(),
      role: z.enum(['customer', 'mechanic']).optional().default('customer'),
    }))
    .mutation(async ({ input }) => {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: input.email }
        });

        if (existingUser) {
          return {
            success: false,
            error: 'An account with this email already exists'
          };
        }

        // Hash password
        const passwordHash = await bcrypt.hash(input.password, 10);

        // Create user in database
        const newUser = await prisma.user.create({
          data: {
            email: input.email,
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            role: input.role.toUpperCase() as 'CUSTOMER' | 'MECHANIC',
            passwordHash,
            status: 'ACTIVE',
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            phone: true,
            createdAt: true,
            status: true,
          }
        });

        // Generate JWT token
        const token = generateToken({
          id: newUser.id,
          email: newUser.email,
          role: newUser.role
        });

        console.log('Signup successful:', {
          userId: newUser.id,
          email: newUser.email,
          role: newUser.role,
          timestamp: new Date().toISOString()
        });

        return {
          success: true,
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role.toLowerCase(),
            phone: newUser.phone,
            createdAt: newUser.createdAt,
            isActive: newUser.status === 'ACTIVE',
          },
          token
        };
      } catch (error) {
        console.error('Signup error:', error);
        return {
          success: false,
          error: 'Failed to create account. Please try again.'
        };
      }
    }),

  signin: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: input.email },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            passwordHash: true,
            status: true,
            createdAt: true,
          }
        });

        if (!user) {
          return {
            success: false,
            error: 'Invalid credentials'
          };
        }

        // Check if user is active
        if (user.status !== 'ACTIVE') {
          return {
            success: false,
            error: 'Your account has been suspended. Please contact support.'
          };
        }

        // Verify password
        if (!user.passwordHash) {
          return {
            success: false,
            error: 'Invalid credentials'
          };
        }

        const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);

        if (!isValidPassword) {
          return {
            success: false,
            error: 'Invalid credentials'
          };
        }

        // Generate JWT token
        const token = generateToken({
          id: user.id,
          email: user.email,
          role: user.role
        });

        console.log('Signin successful:', {
          userId: user.id,
          email: user.email,
          timestamp: new Date().toISOString()
        });

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role.toLowerCase() as 'customer' | 'mechanic' | 'admin',
            createdAt: user.createdAt,
            isActive: true,
          },
          token
        };
      } catch (error) {
        console.error('Signin error:', error);
        return {
          success: false,
          error: 'Failed to sign in. Please try again.'
        };
      }
    }),

  verifyToken: publicProcedure
    .input(z.object({
      token: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        // Verify JWT token
        const decoded = verifyToken(input.token);

        if (!decoded) {
          return {
            valid: false,
            error: 'Invalid or expired token'
          };
        }

        // Check if user still exists and is active
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
          }
        });

        if (!user || user.status !== 'ACTIVE') {
          return {
            valid: false,
            error: 'User not found or inactive'
          };
        }

        return {
          valid: true,
          user: {
            id: user.id,
            email: user.email,
            role: user.role.toLowerCase() as 'customer' | 'mechanic' | 'admin',
          }
        };
      } catch (error) {
        console.error('Token verification error:', error);
        return {
          valid: false,
          error: 'Failed to verify token'
        };
      }
    }),
});
