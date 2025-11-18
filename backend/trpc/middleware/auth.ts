import { TRPCError } from '@trpc/server';
import type { Context } from '../create-context';

/**
 * JWT Authentication Middleware
 * HEI-131: Implements JWT token verification for protected procedures
 */

// Simple JWT verification (in production, use jsonwebtoken library)
export interface DecodedToken {
  userId: string;
  email: string;
  role: 'admin' | 'mechanic' | 'customer';
  iat?: number;
  exp?: number;
}

// Secret key for JWT (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

/**
 * Verify JWT token
 * This is a simplified implementation. In production, use jsonwebtoken library
 */
export function verifyToken(token: string): DecodedToken {
  try {
    // For development, accept mock tokens
    if (token === 'mock-jwt-token' || token.startsWith('dev-')) {
      return {
        userId: 'dev-user',
        email: 'dev@example.com',
        role: 'customer',
      };
    }

    // In production, implement proper JWT verification
    // Example with jsonwebtoken:
    // const decoded = jwt.verify(token, JWT_SECRET);
    // return decoded as DecodedToken;

    // For now, parse a simple base64-encoded token (NOT SECURE - FOR DEV ONLY)
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1] || '', 'base64').toString());
      return payload as DecodedToken;
    } catch {
      throw new Error('Invalid token format');
    }
  } catch (error) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired token',
    });
  }
}

/**
 * Extract token from request headers
 */
export function extractToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    return null;
  }

  // Support both "Bearer token" and "token" formats
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return authHeader;
}

/**
 * Authentication middleware function
 */
export async function authenticate(ctx: Context): Promise<DecodedToken> {
  const token = extractToken(ctx.req);

  if (!token) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Please provide a valid token.',
    });
  }

  const decoded = verifyToken(token);

  // Log authentication for security monitoring
  console.log('Authentication successful:', {
    userId: decoded.userId,
    role: decoded.role,
    timestamp: new Date().toISOString(),
    ip: ctx.req.headers.get('x-forwarded-for') || 'unknown',
  });

  return decoded;
}

/**
 * Role-based authorization check
 */
export function requireRole(user: DecodedToken, allowedRoles: Array<'admin' | 'mechanic' | 'customer'>): void {
  if (!allowedRoles.includes(user.role)) {
    console.warn('Unauthorized access attempt:', {
      userId: user.userId,
      role: user.role,
      requiredRoles: allowedRoles,
      timestamp: new Date().toISOString(),
    });

    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
    });
  }
}
