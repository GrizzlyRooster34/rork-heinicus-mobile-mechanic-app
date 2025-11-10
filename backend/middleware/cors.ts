import { validatedEnv, isDevelopment, isProduction } from '../env-validation';

/**
 * CORS Configuration Middleware
 * Configures Cross-Origin Resource Sharing based on environment
 */

/**
 * Get allowed origins based on environment
 */
export function getAllowedOrigins(): string[] {
  if (isDevelopment()) {
    // In development, allow localhost on any port
    return [
      'http://localhost:3000',
      'http://localhost:8081',
      'http://localhost:19000',
      'http://localhost:19001',
      'http://localhost:19002',
      // Allow Expo dev client
      'exp://localhost:8081',
      'exp://192.168.*',
      // Allow any localhost port for flexibility
      /http:\/\/localhost:\d+/,
    ] as any;
  }

  // Production origins
  const allowedOrigins: string[] = [];

  // Add frontend URL if configured
  if (validatedEnv.FRONTEND_URL) {
    allowedOrigins.push(validatedEnv.FRONTEND_URL);
  }

  // Add additional origins from environment variable if configured
  if (process.env.ADDITIONAL_CORS_ORIGINS) {
    const additionalOrigins = process.env.ADDITIONAL_CORS_ORIGINS.split(',').map(o => o.trim());
    allowedOrigins.push(...additionalOrigins);
  }

  // Default production domains (update these with actual production domains)
  if (allowedOrigins.length === 0) {
    allowedOrigins.push(
      'https://heinicus-mobile-mechanic.app',
      'https://www.heinicus-mobile-mechanic.app',
      'https://api.heinicus-mobile-mechanic.app'
    );
  }

  return allowedOrigins;
}

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    return true;
  }

  const allowedOrigins = getAllowedOrigins();

  // Check exact matches
  if (allowedOrigins.some(allowed =>
    typeof allowed === 'string' && allowed === origin
  )) {
    return true;
  }

  // Check regex patterns (for development)
  if (isDevelopment()) {
    if (allowedOrigins.some(allowed =>
      allowed instanceof RegExp && allowed.test(origin)
    )) {
      return true;
    }

    // In development, also allow any localhost or 192.168.* addresses
    if (origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('http://192.168.')) {
      return true;
    }

    // Allow Expo origins
    if (origin.startsWith('exp://')) {
      return true;
    }
  }

  return false;
}

/**
 * CORS configuration options
 */
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS: Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies and authentication headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'Accept',
    'Accept-Language',
    'Content-Language',
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'Retry-After',
  ],
  maxAge: 86400, // 24 hours - cache preflight requests
};

/**
 * Express CORS middleware
 */
export function corsMiddleware(req: any, res: any, next: any) {
  const origin = req.headers.origin;

  if (isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader(
      'Access-Control-Allow-Methods',
      corsOptions.methods.join(', ')
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      corsOptions.allowedHeaders.join(', ')
    );
    res.setHeader(
      'Access-Control-Expose-Headers',
      corsOptions.exposedHeaders.join(', ')
    );
    res.setHeader('Access-Control-Max-Age', corsOptions.maxAge.toString());

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
  } else if (origin) {
    console.warn(`CORS: Blocked request from origin: ${origin}`);
    res.status(403).json({
      error: 'CORS policy violation',
      message: 'Origin not allowed',
    });
    return;
  }

  next();
}

/**
 * tRPC CORS middleware
 */
export function createCORSMiddleware() {
  return ({ ctx, next }: any) => {
    const origin = ctx.req?.headers?.origin;

    if (origin && !isOriginAllowed(origin)) {
      console.warn(`CORS: Blocked tRPC request from origin: ${origin}`);
      throw new Error('Origin not allowed by CORS policy');
    }

    return next({
      ctx,
    });
  };
}

/**
 * Log CORS configuration on startup
 */
export function logCORSConfig() {
  console.log('\n🔒 CORS Configuration:');
  console.log(`   Environment: ${validatedEnv.NODE_ENV}`);

  if (isDevelopment()) {
    console.log('   Mode: Development (permissive)');
    console.log('   Allowed: All localhost, 192.168.*, and Expo origins');
  } else {
    console.log('   Mode: Production (strict)');
    const allowedOrigins = getAllowedOrigins();
    console.log('   Allowed origins:');
    allowedOrigins.forEach(origin => {
      console.log(`     - ${origin}`);
    });
  }

  console.log(`   Credentials: ${corsOptions.credentials ? 'Enabled' : 'Disabled'}`);
  console.log(`   Methods: ${corsOptions.methods.join(', ')}`);
  console.log('');
}
