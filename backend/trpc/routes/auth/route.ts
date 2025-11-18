import { z } from 'zod';
import bcrypt from 'bcrypt';
import { publicProcedure, createTRPCRouter } from '../../create-context';
import { prisma } from '../../../lib/prisma';

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
      console.log('Signup attempt:', {
        email: input.email,
        firstName: input.firstName,
        role: input.role,
        timestamp: new Date().toISOString()
      });

      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: input.email },
        });

        if (existingUser) {
          console.log('Signup failed - user exists:', { email: input.email });
          return {
            success: false,
            error: 'An account with this email already exists'
          };
        }

        // Hash the password
        const passwordHash = await bcrypt.hash(input.password, 10);

        // Map role to enum format (uppercase)
        const roleMap = {
          'customer': 'CUSTOMER',
          'mechanic': 'MECHANIC',
          'admin': 'ADMIN',
        } as const;

        // Create new user in database
        const newUser = await prisma.user.create({
          data: {
            email: input.email,
            passwordHash,
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            role: roleMap[input.role as keyof typeof roleMap],
          },
        });

        console.log('Signup successful:', {
          userId: newUser.id,
          email: newUser.email,
          role: newUser.role,
          timestamp: new Date().toISOString()
        });

        // Map role back to lowercase for frontend
        const userResponse = {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role.toLowerCase() as 'customer' | 'mechanic' | 'admin',
          phone: newUser.phone,
          createdAt: newUser.createdAt,
          isActive: newUser.isActive,
        };

        return {
          success: true,
          user: userResponse,
          token: 'mock-jwt-token' // TODO: Implement proper JWT
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
      console.log('Signin attempt:', {
        email: input.email,
        timestamp: new Date().toISOString()
      });

      try {
        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: input.email },
        });

        if (!user) {
          console.log('Signin failed - user not found:', { email: input.email });
          return {
            success: false,
            error: 'Invalid credentials'
          };
        }

        // Verify password
        const passwordValid = await bcrypt.compare(input.password, user.passwordHash);

        if (!passwordValid) {
          console.log('Signin failed - invalid password:', { email: input.email });
          return {
            success: false,
            error: 'Invalid credentials'
          };
        }

        console.log('Signin successful:', {
          userId: user.id,
          email: user.email,
          role: user.role,
          timestamp: new Date().toISOString()
        });

        // Map role back to lowercase for frontend
        const userResponse = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role.toLowerCase() as 'customer' | 'mechanic' | 'admin',
          phone: user.phone,
          createdAt: user.createdAt,
          isActive: user.isActive,
        };

        return {
          success: true,
          user: userResponse,
          token: 'mock-jwt-token' // TODO: Implement proper JWT
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
      // In a real app, this would verify JWT token
      console.log('Token verification:', {
        token: input.token,
        timestamp: new Date().toISOString()
      });

      // Mock token verification
      if (input.token === 'mock-jwt-token') {
        return {
          valid: true,
          user: {
            id: 'user-1',
            email: 'user@example.com',
            role: 'customer' as const,
          }
        };
      }

      return {
        valid: false,
        error: 'Invalid token'
      };
    }),
});
