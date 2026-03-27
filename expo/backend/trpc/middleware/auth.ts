import { TRPCError } from '@trpc/server';
import jwt from 'jsonwebtoken';
import { initTRPC } from '@trpc/server';
import type { Context } from '../create-context';

// Define the shape of the JWT payload
export interface JWTPayload {
  userId: string;
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}

// Create a type for the authenticated context
export interface AuthContext extends Context {
  user: JWTPayload;
}

const t = initTRPC.context<Context>().create();

/**
 * Authentication middleware that validates JWT tokens
 * Extracts token from Authorization header, validates it, and attaches user to context
 */
export const isAuthed = t.middleware(async ({ ctx, next }) => {
  // Get the authorization header
  const authHeader = ctx.req.headers.get('authorization');

  if (!authHeader) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'No authorization header provided',
    });
  }

  // Extract the token from "Bearer <token>" format
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader;

  if (!token) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'No token provided',
    });
  }

  // Get JWT secret from environment variable
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'JWT_SECRET is not configured',
    });
  }

  try {
    // Verify and decode the JWT token
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Attach the decoded user to the context
    return next({
      ctx: {
        ...ctx,
        user: decoded,
      },
    });
  } catch (error) {
    // Handle specific JWT errors
    if (error instanceof jwt.JsonWebTokenError) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid token',
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Token has expired',
      });
    }

    // Unknown error
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication failed',
    });
  }
});
