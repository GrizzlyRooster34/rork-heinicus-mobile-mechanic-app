import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import jwt from 'jsonwebtoken';

// Re-export tRPC utilities for convenience
export { router, publicProcedure, protectedProcedure, createTRPCRouter } from './trpc';

// JWT secret - should match the one in auth route
const JWT_SECRET = process.env.JWT_SECRET || 'heinicus-mobile-mechanic-secret-key-for-dev-only';

export function createContext(opts: FetchCreateContextFnOptions) {
  // Extract JWT token from Authorization header
  const authHeader = opts.req.headers.get('authorization');
  let user: { userId: string; email: string; role: 'customer' | 'mechanic' | 'admin' } | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        role: 'customer' | 'mechanic' | 'admin';
      };
      user = decoded;
    } catch (error) {
      // Token is invalid or expired - user remains null
      console.error('JWT verification failed in context:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  return {
    req: opts.req,
    user,
    environment: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
  };
}

export type Context = ReturnType<typeof createContext>;