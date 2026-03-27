import jwt from 'jsonwebtoken';
import { TRPCError } from '@trpc/server';
import { prisma } from '../../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'heinicus-mobile-mechanic-app-jwt-secret-key-2025-very-secure-and-long-at-least-64-chars';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Extract JWT token from Authorization header
 */
export function extractToken(authHeader?: string): string | null {
  if (!authHeader) {
    return null;
  }

  // Support both "Bearer <token>" and just "<token>"
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return null;
}

/**
 * Verify JWT token and return decoded payload
 */
export function verifyJWTToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Get user from JWT token
 */
export async function getUserFromToken(token: string) {
  const decoded = verifyJWTToken(token);

  if (!decoded) {
    return null;
  }

  // Verify user still exists and is active
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      twoFactorEnabled: true,
    },
  });

  if (!user || user.status !== 'ACTIVE') {
    return null;
  }

  return user;
}

/**
 * Middleware to require authentication
 * Throws UNAUTHORIZED error if no valid token
 */
export async function requireAuth(authHeader?: string) {
  if (!authHeader) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Please provide a valid token.',
    });
  }

  const token = extractToken(authHeader);

  if (!token) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid authorization header format',
    });
  }

  const user = await getUserFromToken(token);

  if (!user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired token',
    });
  }

  return user;
}

/**
 * Middleware to require specific role
 */
export async function requireRole(authHeader: string | undefined, allowedRoles: string[]) {
  const user = await requireAuth(authHeader);

  if (!allowedRoles.includes(user.role)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
    });
  }

  return user;
}

/**
 * Optional auth - returns user if token is valid, null otherwise
 * Does not throw errors
 */
export async function optionalAuth(authHeader?: string) {
  if (!authHeader) {
    return null;
  }

  const token = extractToken(authHeader);

  if (!token) {
    return null;
  }

  const user = await getUserFromToken(token);
  return user;
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(payload: {
  userId: string;
  email: string;
  role: string;
}): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d', // 7 days
  });
}

/**
 * Generate refresh token (longer expiration)
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: '30d', // 30 days
  });
}

/**
 * Verify and refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  success: boolean;
  accessToken?: string;
  error?: string;
}> {
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: string };

    // Get user to generate new access token
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return {
        success: false,
        error: 'User not found or inactive',
      };
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      success: true,
      accessToken,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Invalid or expired refresh token',
    };
  }
}
