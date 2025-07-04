import { z } from 'zod';
import { publicProcedure, createTRPCRouter } from '../../create-context';

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
      
      return {
        success: true,
        user: newUser,
        token: 'mock-jwt-token'
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
        return {
          success: true,
          user: {
            id: 'admin-cody',
            email: input.email,
            firstName: 'Cody',
            lastName: 'Owner',
            role: 'admin' as const,
            createdAt: new Date(),
            isActive: true,
          },
          token: 'mock-jwt-token'
        };
      }
      
      if (input.email === 'cody@heinicus.com' && input.password === 'RoosTer669072!@') {
        return {
          success: true,
          user: {
            id: 'mechanic-cody',
            email: input.email,
            firstName: 'Cody',
            lastName: 'Mechanic',
            role: 'mechanic' as const,
            createdAt: new Date(),
            isActive: true,
          },
          token: 'mock-jwt-token'
        };
      }
      
      // Mock customer login
      if (input.email === 'customer@example.com') {
        return {
          success: true,
          user: {
            id: 'customer-demo',
            email: input.email,
            firstName: 'Demo',
            lastName: 'Customer',
            role: 'customer' as const,
            createdAt: new Date(),
            isActive: true,
          },
          token: 'mock-jwt-token'
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