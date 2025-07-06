import { z } from 'zod';
import { publicProcedure, router } from '../../trpc';
import { prisma } from '../../../../lib/prisma';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

export const authRouter = router({
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
        const hashedPassword = await bcrypt.hash(input.password, 12);
        
        // Create user with profile
        const newUser = await prisma.user.create({
          data: {
            email: input.email,
            password: hashedPassword,
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            role: input.role?.toUpperCase() as 'CUSTOMER' | 'MECHANIC' || 'CUSTOMER',
            // Create appropriate profile based on role
            ...(input.role === 'customer' && {
              customerProfile: {
                create: {}
              }
            }),
            ...(input.role === 'mechanic' && {
              mechanicProfile: {
                create: {}
              }
            })
          },
          include: {
            customerProfile: true,
            mechanicProfile: true
          }
        });
        
        // Generate JWT token
        const token = jwt.sign(
          { userId: newUser.id, email: newUser.email, role: newUser.role },
          process.env.NEXTAUTH_SECRET || 'default-secret',
          { expiresIn: '7d' }
        );
        
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
            isActive: newUser.isActive,
          },
          token
        };
      } catch (error) {
        console.error('Signup error:', error);
        return {
          success: false,
          error: 'Failed to create account'
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
          include: {
            customerProfile: true,
            mechanicProfile: true,
            adminProfile: true
          }
        });
        
        if (!user) {
          return {
            success: false,
            error: 'Invalid credentials'
          };
        }
        
        // Verify password
        const isValidPassword = await bcrypt.compare(input.password, user.password);
        
        if (!isValidPassword) {
          return {
            success: false,
            error: 'Invalid credentials'
          };
        }
        
        // Check if user is active
        if (!user.isActive) {
          return {
            success: false,
            error: 'Account is inactive'
          };
        }
        
        // Generate JWT token
        const token = jwt.sign(
          { userId: user.id, email: user.email, role: user.role },
          process.env.NEXTAUTH_SECRET || 'default-secret',
          { expiresIn: '7d' }
        );
        
        console.log('Signin successful:', { 
          userId: user.id, 
          email: user.email,
          role: user.role,
          timestamp: new Date().toISOString()
        });
        
        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role.toLowerCase(),
            phone: user.phone,
            createdAt: user.createdAt,
            isActive: user.isActive,
          },
          token
        };
      } catch (error) {
        console.error('Signin error:', error);
        return {
          success: false,
          error: 'Failed to sign in'
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
        const decoded = jwt.verify(
          input.token,
          process.env.NEXTAUTH_SECRET || 'default-secret'
        ) as { userId: string; email: string; role: string };
        
        // Find user in database
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: {
            customerProfile: true,
            mechanicProfile: true,
            adminProfile: true
          }
        });
        
        if (!user || !user.isActive) {
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
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role.toLowerCase(),
            phone: user.phone,
          }
        };
      } catch (error) {
        console.error('Token verification error:', error);
        return {
          valid: false,
          error: 'Invalid token'
        };
      }
    }),
});