/**
 * Environment Variable Validation
 *
 * Validates all required environment variables on application startup.
 * Fails fast if critical variables are missing or invalid.
 */

import { z } from 'zod';

// Define environment schema
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),

  // Optional: Separate connection pool URL for production
  CONNECTION_POOL_URL: z.string().url().optional(),

  // JWT Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters for security'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Stripe Payment Processing
  STRIPE_SECRET_KEY: z.string().startsWith('sk_', 'STRIPE_SECRET_KEY must start with sk_'),
  STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_', 'STRIPE_PUBLISHABLE_KEY must start with pk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_', 'STRIPE_WEBHOOK_SECRET must start with whsec_').optional(),

  // Firebase (for push notifications, analytics)
  FIREBASE_PROJECT_ID: z.string().min(1, 'FIREBASE_PROJECT_ID is required'),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),

  // Or Firebase Service Account JSON path
  FIREBASE_SERVICE_ACCOUNT: z.string().optional(),

  // Google Maps API (for location services)
  GOOGLE_MAPS_API_KEY: z.string().optional(),

  // NHTSA API Key (for VIN decoding)
  NHTSA_API_KEY: z.string().optional(),

  // Twilio (for SMS notifications)
  TWILIO_ACCOUNT_SID: z.string().startsWith('AC').optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // SendGrid (for email notifications)
  SENDGRID_API_KEY: z.string().startsWith('SG.').optional(),
  SENDGRID_FROM_EMAIL: z.string().email().optional(),

  // Server Configuration
  PORT: z.string().default('3000'),
  HOST: z.string().default('localhost'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:*'),

  // Redis (for caching, sessions, rate limiting)
  REDIS_URL: z.string().url().optional(),
  REDIS_PASSWORD: z.string().optional(),

  // Sentry (for error tracking)
  SENTRY_DSN: z.string().url().optional(),

  // Feature Flags
  ENABLE_AI_DIAGNOSTICS: z.enum(['true', 'false']).default('false'),
  ENABLE_DEBUG_LOGS: z.enum(['true', 'false']).default('false'),

  // Security
  RATE_LIMIT_WINDOW_MS: z.string().default('60000'), // 1 minute
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),

  // Session
  SESSION_SECRET: z.string().min(32).optional(),
});

// Parse and validate environment variables
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Environment variable validation failed:\n');

    (error as any).errors.forEach((err: any) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });

    console.error('\n💡 Fix the above errors in your .env file and restart the server.\n');
    console.error('See .env.example for required environment variables.\n');

    process.exit(1);
  }
  throw error;
}

// Additional custom validations
if (env.NODE_ENV === 'production') {
  // Enforce stricter requirements in production

  if (!env.CONNECTION_POOL_URL && !env.DATABASE_URL.includes('pooling')) {
    console.warn('⚠️  WARNING: Consider using connection pooling in production');
    console.warn('   Set CONNECTION_POOL_URL or use a pooling service like PgBouncer\n');
  }

  if (!env.STRIPE_WEBHOOK_SECRET) {
    console.error('❌ STRIPE_WEBHOOK_SECRET is required in production');
    process.exit(1);
  }

  if (!env.FIREBASE_SERVICE_ACCOUNT && (!env.FIREBASE_PRIVATE_KEY || !env.FIREBASE_CLIENT_EMAIL)) {
    console.error('❌ Firebase configuration is required in production');
    console.error('   Set either FIREBASE_SERVICE_ACCOUNT or FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL');
    process.exit(1);
  }

  if (!env.SENTRY_DSN) {
    console.warn('⚠️  WARNING: SENTRY_DSN not set - error tracking disabled in production\n');
  }

  if (env.JWT_SECRET.length < 64) {
    console.warn('⚠️  WARNING: JWT_SECRET should be at least 64 characters in production\n');
  }
}

// Export validated environment variables
export const validatedEnv = env;

// Helper functions
export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development';
}

export function isProduction(): boolean {
  return env.NODE_ENV === 'production';
}

export function isStaging(): boolean {
  return env.NODE_ENV === 'staging';
}

export function getEnv(key: keyof typeof env): string | undefined {
  return env[key];
}

// Print configuration summary (hiding sensitive values)
export function printEnvSummary(): void {
  console.log('📋 Environment Configuration:');
  console.log(`   Environment: ${env.NODE_ENV}`);
  console.log(`   Port: ${env.PORT}`);
  console.log(`   Host: ${env.HOST}`);
  console.log(`   Database: ${env.DATABASE_URL.includes('localhost') ? 'localhost' : 'remote'}`);
  console.log(`   Stripe: ${env.STRIPE_SECRET_KEY.includes('_test_') ? 'test mode' : 'live mode'}`);
  console.log(`   Firebase: ${env.FIREBASE_PROJECT_ID}`);
  console.log(`   AI Diagnostics: ${env.ENABLE_AI_DIAGNOSTICS}`);
  console.log(`   Debug Logs: ${env.ENABLE_DEBUG_LOGS}`);

  if (env.REDIS_URL) {
    console.log(`   Redis: enabled`);
  }
  if (env.SENTRY_DSN) {
    console.log(`   Sentry: enabled`);
  }
  if (env.TWILIO_ACCOUNT_SID) {
    console.log(`   Twilio SMS: enabled`);
  }
  if (env.SENDGRID_API_KEY) {
    console.log(`   SendGrid Email: enabled`);
  }

  console.log('');
}

// Call this on server startup
if (require.main === module) {
  printEnvSummary();
}

export default validatedEnv;
