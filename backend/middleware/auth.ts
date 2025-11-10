import jwt from 'jsonwebtoken';
import { TRPCError } from '@trpc/server';
import { validatedEnv } from '../env-validation';
import { prisma } from '../../lib/prisma';
import { UserRole } from '@prisma/client';

/**
 * Authentication Middleware
 * Handles JWT verification, token refresh, and session management
 */

/**
 * JWT payload interface
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Authenticated context
 */
export interface AuthContext {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
  token: string;
}

/**
 * Token expiration times
 */
export const TOKEN_EXPIRATION = {
  accessToken: '7d', // 7 days
  refreshToken: '30d', // 30 days
  resetToken: '1h', // 1 hour
};

/**
 * In-memory token blacklist
 * In production, use Redis for distributed blacklist
 */
const tokenBlacklist = new Set<string>();

/**
 * Add token to blacklist
 */
export function blacklistToken(token: string): void {
  tokenBlacklist.add(token);

  // Auto-cleanup after expiration + buffer
  setTimeout(() => {
    tokenBlacklist.delete(token);
  }, 8 * 24 * 60 * 60 * 1000); // 8 days (7 days + 1 day buffer)
}

/**
 * Check if token is blacklisted
 */
export function isTokenBlacklisted(token: string): boolean {
  return tokenBlacklist.has(token);
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, validatedEnv.JWT_SECRET, {
    expiresIn: TOKEN_EXPIRATION.accessToken,
    issuer: 'heinicus-mobile-mechanic',
    audience: 'heinicus-api',
  });
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'refresh' },
    validatedEnv.JWT_SECRET,
    {
      expiresIn: TOKEN_EXPIRATION.refreshToken,
      issuer: 'heinicus-mobile-mechanic',
      audience: 'heinicus-api',
    }
  );
}

/**
 * Generate password reset token
 */
export function generateResetToken(email: string): string {
  return jwt.sign(
    { email, type: 'reset' },
    validatedEnv.JWT_SECRET,
    {
      expiresIn: TOKEN_EXPIRATION.resetToken,
      issuer: 'heinicus-mobile-mechanic',
      audience: 'heinicus-api',
    }
  );
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, validatedEnv.JWT_SECRET, {
      issuer: 'heinicus-mobile-mechanic',
      audience: 'heinicus-api',
    }) as JWTPayload;

    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  // Support both "Bearer <token>" and just "<token>"
  const parts = authHeader.split(' ');

  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }

  return null;
}

/**
 * Verify user exists and is active
 */
export async function verifyUserStatus(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true },
  });

  return user !== null && user.isActive;
}

/**
 * Express authentication middleware
 */
export async function authenticateRequest(req: any, res: any, next: any) {
  try {
    const token = extractToken(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided',
      });
    }

    // Check if token is blacklisted
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has been revoked',
      });
    }

    // Verify token
    const payload = verifyToken(token);

    // Verify user is still active
    const isActive = await verifyUserStatus(payload.userId);
    if (!isActive) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User account is inactive',
      });
    }

    // Attach user to request
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };
    req.token = token;

    next();
  } catch (error: any) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({
      error: 'Unauthorized',
      message: error.message || 'Authentication failed',
    });
  }
}

/**
 * tRPC authentication middleware
 */
export function createAuthMiddleware() {
  return async ({ ctx, next }: any) => {
    try {
      const token = extractToken(ctx.req?.headers?.authorization);

      if (!token) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No authentication token provided',
        });
      }

      // Check if token is blacklisted
      if (isTokenBlacklisted(token)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Token has been revoked',
        });
      }

      // Verify token
      const payload = verifyToken(token);

      // Verify user is still active
      const isActive = await verifyUserStatus(payload.userId);
      if (!isActive) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User account is inactive',
        });
      }

      // Return context with user
      return next({
        ctx: {
          ...ctx,
          user: {
            id: payload.userId,
            email: payload.email,
            role: payload.role,
          },
          token,
        },
      });
    } catch (error: any) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: error.message || 'Authentication failed',
      });
    }
  };
}

/**
 * Role-based access control middleware
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return ({ ctx, next }: any) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      });
    }

    return next({
      ctx,
    });
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  try {
    const payload = verifyToken(refreshToken) as any;

    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const newRefreshToken = generateRefreshToken(user.id);

    // Blacklist old refresh token
    blacklistToken(refreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error: any) {
    throw new Error(`Token refresh failed: ${error.message}`);
  }
}

/**
 * Invalidate all user sessions
 */
export async function invalidateUserSessions(userId: string): Promise<void> {
  // In production with Redis, this would:
  // 1. Add userId to a "invalidated users" set with expiration
  // 2. Check this set during authentication
  // 3. Force user to re-login

  console.log(`All sessions invalidated for user: ${userId}`);

  // For now, we can only blacklist tokens we know about
  // This is a limitation of JWT - proper session management requires Redis/DB
}

/**
 * Logout user (blacklist current token)
 */
export function logout(token: string): void {
  blacklistToken(token);
  console.log('User logged out, token blacklisted');
}

/**
 * Get token expiration time
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const payload = verifyToken(token);
    if (payload.exp) {
      return new Date(payload.exp * 1000);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if token is about to expire (within 1 day)
 */
export function isTokenExpiringSoon(token: string): boolean {
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return true;
  }

  const oneDayFromNow = new Date();
  oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

  return expiration < oneDayFromNow;
}
