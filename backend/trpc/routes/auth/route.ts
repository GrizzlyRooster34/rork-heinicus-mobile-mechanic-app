import { z } from 'zod';
import { publicProcedure, createTRPCRouter } from '../../create-context';
import jwt from 'jsonwebtoken';

// JWT secret - in production, this should come from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'heinicus-mobile-mechanic-secret-key-change-in-production';
const JWT_EXPIRATION = '7d'; // 7 days

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
      // In a real app, this would hash the password and save to database
      console.log('Signup attempt:', { 
        email: input.email, 
        firstName: input.firstName,
        role: input.role,
        timestamp: new Date().toISOString()
      });
      
      // Check if user already exists (mock check)
      const existingUsers = [
        'matthew.heinen.2014@gmail.com',
        'cody@heinicus.com',
        'customer@example.com'
      ];
      
      if (existingUsers.includes(input.email)) {
        return {
          success: false,
          error: 'An account with this email already exists'
        };
      }
      
      // Mock successful signup
      const newUser = {
        id: `user-${Date.now()}`,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role as 'customer' | 'mechanic',
        phone: input.phone,
        createdAt: new Date(),
        isActive: true,
      };
      
      console.log('Signup successful:', {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        timestamp: new Date().toISOString()
      });

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: newUser.id,
          email: newUser.email,
          role: newUser.role,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
      );

      return {
        success: true,
        user: newUser,
        token
      };
    }),

  signin: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      // In a real app, this would verify password hash
      console.log('Signin attempt:', { 
        email: input.email,
        timestamp: new Date().toISOString()
      });
      
      // Mock authentication logic
      if (input.email === 'matthew.heinen.2014@gmail.com' && input.password === 'RoosTer669072!@') {
        const user = {
          id: 'admin-cody',
          email: input.email,
          firstName: 'Cody',
          lastName: 'Owner',
          role: 'admin' as const,
          createdAt: new Date(),
          isActive: true,
        };

        const token = jwt.sign(
          {
            userId: user.id,
            email: user.email,
            role: user.role,
          },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRATION }
        );

        return {
          success: true,
          user,
          token
        };
      }

      if (input.email === 'cody@heinicus.com' && input.password === 'RoosTer669072!@') {
        const user = {
          id: 'mechanic-cody',
          email: input.email,
          firstName: 'Cody',
          lastName: 'Mechanic',
          role: 'mechanic' as const,
          createdAt: new Date(),
          isActive: true,
        };

        const token = jwt.sign(
          {
            userId: user.id,
            email: user.email,
            role: user.role,
          },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRATION }
        );

        return {
          success: true,
          user,
          token
        };
      }

      // Mock customer login
      if (input.email === 'customer@example.com') {
        const user = {
          id: 'customer-demo',
          email: input.email,
          firstName: 'Demo',
          lastName: 'Customer',
          role: 'customer' as const,
          createdAt: new Date(),
          isActive: true,
        };

        const token = jwt.sign(
          {
            userId: user.id,
            email: user.email,
            role: user.role,
          },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRATION }
        );

        return {
          success: true,
          user,
          token
        };
      }
      
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }),

  verifyToken: publicProcedure
    .input(z.object({
      token: z.string(),
    }))
    .query(async ({ input }) => {
      console.log('Token verification:', {
        timestamp: new Date().toISOString()
      });

      try {
        // Verify JWT token
        const decoded = jwt.verify(input.token, JWT_SECRET) as {
          userId: string;
          email: string;
          role: 'customer' | 'mechanic' | 'admin';
        };

        return {
          valid: true,
          user: {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
          }
        };
      } catch (error) {
        console.error('Token verification failed:', error);
        return {
          valid: false,
          error: error instanceof Error ? error.message : 'Invalid token'
        };
      }
    }),
});