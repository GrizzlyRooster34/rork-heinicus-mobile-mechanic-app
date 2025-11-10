import { validatedEnv, isDevelopment } from '../env-validation';

/**
 * Security Headers Middleware
 * Implements security headers similar to Helmet.js
 * Protects against common web vulnerabilities
 */

/**
 * Security headers configuration
 */
export const securityHeadersConfig = {
  // Prevent clickjacking attacks
  xFrameOptions: {
    action: 'DENY' as 'DENY' | 'SAMEORIGIN',
  },

  // Prevent MIME type sniffing
  xContentTypeOptions: {
    nosniff: true,
  },

  // Enable XSS protection in older browsers
  xXSSProtection: {
    enabled: true,
    mode: 'block',
  },

  // Strict Transport Security (HTTPS only)
  strictTransportSecurity: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin' as const,
  },

  // Permissions Policy (formerly Feature Policy)
  permissionsPolicy: {
    camera: ['self'],
    microphone: ['self'],
    geolocation: ['self'],
    payment: ['self'],
    usb: [],
    interest_cohort: [], // Disable FLoC
  },

  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: isDevelopment()
        ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
        : ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: isDevelopment()
        ? ["'self'", 'http://localhost:*', 'ws://localhost:*', 'wss://localhost:*']
        : ["'self'", 'https://api.stripe.com'],
      frameSrc: ["'self'", 'https://js.stripe.com'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      workerSrc: ["'self'", 'blob:'],
      formAction: ["'self'"],
      upgradeInsecureRequests: !isDevelopment() ? [] : undefined,
    },
  },
};

/**
 * Format Content Security Policy directives
 */
function formatCSPDirectives(directives: Record<string, string[] | undefined>): string {
  return Object.entries(directives)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => {
      // Convert camelCase to kebab-case
      const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return Array.isArray(value) && value.length > 0
        ? `${kebabKey} ${value.join(' ')}`
        : kebabKey;
    })
    .join('; ');
}

/**
 * Format Permissions Policy directives
 */
function formatPermissionsPolicyDirectives(
  directives: Record<string, string[]>
): string {
  return Object.entries(directives)
    .map(([key, value]) => {
      const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      if (value.length === 0) {
        return `${kebabKey}=()`;
      }
      const values = value.map(v => (v === 'self' ? 'self' : `"${v}"`)).join(' ');
      return `${kebabKey}=(${values})`;
    })
    .join(', ');
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(res: any) {
  // X-Frame-Options
  res.setHeader('X-Frame-Options', securityHeadersConfig.xFrameOptions.action);

  // X-Content-Type-Options
  if (securityHeadersConfig.xContentTypeOptions.nosniff) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }

  // X-XSS-Protection (legacy, but still useful for older browsers)
  if (securityHeadersConfig.xXSSProtection.enabled) {
    res.setHeader(
      'X-XSS-Protection',
      securityHeadersConfig.xXSSProtection.mode === 'block' ? '1; mode=block' : '1'
    );
  }

  // Strict-Transport-Security (HTTPS only, skip in development)
  if (!isDevelopment() && validatedEnv.NODE_ENV === 'production') {
    const { maxAge, includeSubDomains, preload } = securityHeadersConfig.strictTransportSecurity;
    let stsValue = `max-age=${maxAge}`;
    if (includeSubDomains) stsValue += '; includeSubDomains';
    if (preload) stsValue += '; preload';
    res.setHeader('Strict-Transport-Security', stsValue);
  }

  // Referrer-Policy
  res.setHeader('Referrer-Policy', securityHeadersConfig.referrerPolicy.policy);

  // Permissions-Policy
  const permissionsPolicy = formatPermissionsPolicyDirectives(
    securityHeadersConfig.permissionsPolicy
  );
  res.setHeader('Permissions-Policy', permissionsPolicy);

  // Content-Security-Policy
  const csp = formatCSPDirectives(securityHeadersConfig.contentSecurityPolicy.directives);
  res.setHeader('Content-Security-Policy', csp);

  // Additional security headers
  res.setHeader('X-Powered-By', 'Heinicus'); // Hide Express
  res.setHeader('X-DNS-Prefetch-Control', 'off'); // Disable DNS prefetching
  res.setHeader('X-Download-Options', 'noopen'); // Prevent opening downloads in IE
}

/**
 * Express middleware for security headers
 */
export function securityHeadersMiddleware(req: any, res: any, next: any) {
  applySecurityHeaders(res);
  next();
}

/**
 * tRPC middleware for security headers
 */
export function createSecurityHeadersMiddleware() {
  return ({ ctx, next }: any) => {
    if (ctx.res) {
      applySecurityHeaders(ctx.res);
    }

    return next({
      ctx,
    });
  };
}

/**
 * HSTS Preload configuration helper
 * For submitting to https://hstspreload.org/
 */
export function getHSTSPreloadConfig() {
  return {
    domain: process.env.FRONTEND_URL?.replace(/^https?:\/\//, '') || 'heinicus-mobile-mechanic.app',
    maxAge: securityHeadersConfig.strictTransportSecurity.maxAge,
    includeSubDomains: securityHeadersConfig.strictTransportSecurity.includeSubDomains,
    preload: securityHeadersConfig.strictTransportSecurity.preload,
    status: 'To submit to HSTS preload list, visit: https://hstspreload.org/',
  };
}

/**
 * Log security headers configuration on startup
 */
export function logSecurityHeadersConfig() {
  console.log('\n🛡️  Security Headers Configuration:');
  console.log(`   Environment: ${validatedEnv.NODE_ENV}`);
  console.log(`   X-Frame-Options: ${securityHeadersConfig.xFrameOptions.action}`);
  console.log(`   X-Content-Type-Options: ${securityHeadersConfig.xContentTypeOptions.nosniff ? 'nosniff' : 'off'}`);
  console.log(`   X-XSS-Protection: ${securityHeadersConfig.xXSSProtection.enabled ? 'enabled' : 'disabled'}`);

  if (!isDevelopment()) {
    const hsts = securityHeadersConfig.strictTransportSecurity;
    console.log(`   HSTS: max-age=${hsts.maxAge}${hsts.includeSubDomains ? ', includeSubDomains' : ''}${hsts.preload ? ', preload' : ''}`);
  } else {
    console.log('   HSTS: Disabled (development mode)');
  }

  console.log(`   Referrer-Policy: ${securityHeadersConfig.referrerPolicy.policy}`);
  console.log(`   CSP: ${isDevelopment() ? 'Development (permissive)' : 'Production (strict)'}`);
  console.log('');
}

/**
 * Security headers for API responses
 * Lighter version for API-only responses (no CSP needed)
 */
export function applyAPISecurityHeaders(res: any) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Powered-By', 'Heinicus');

  if (!isDevelopment() && validatedEnv.NODE_ENV === 'production') {
    const { maxAge, includeSubDomains, preload } = securityHeadersConfig.strictTransportSecurity;
    let stsValue = `max-age=${maxAge}`;
    if (includeSubDomains) stsValue += '; includeSubDomains';
    if (preload) stsValue += '; preload';
    res.setHeader('Strict-Transport-Security', stsValue);
  }
}

/**
 * API security headers middleware
 */
export function apiSecurityHeadersMiddleware(req: any, res: any, next: any) {
  applyAPISecurityHeaders(res);
  next();
}
