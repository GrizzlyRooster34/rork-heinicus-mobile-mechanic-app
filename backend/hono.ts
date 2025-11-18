import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

/**
 * HEI-131: Enhanced Hono server with security configurations
 * - Proper CORS configuration
 * - Security headers
 * - Request logging
 */

// app will be mounted at /api
const app = new Hono();

// Allowed origins for CORS (configure based on environment)
const getAllowedOrigins = (): string[] => {
  const env = process.env.NODE_ENV || 'development';

  if (env === 'production') {
    // In production, specify exact origins
    return [
      'https://heinicus.com',
      'https://www.heinicus.com',
      'https://app.heinicus.com',
      // Add your production domains here
    ];
  }

  // In development, allow localhost and expo
  return [
    'http://localhost:8081',
    'http://localhost:19006',
    'http://localhost:3000',
    /^exp:\/\/.*$/.toString(), // Expo development
  ];
};

// Enable CORS with proper configuration
app.use("*", cors({
  origin: (origin) => {
    const allowedOrigins = getAllowedOrigins();
    const env = process.env.NODE_ENV || 'development';

    // In development, allow all origins (but still validate in production)
    if (env === 'development') {
      return origin || '*';
    }

    // In production, check against allowed origins
    if (!origin) return allowedOrigins[0];

    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      }
      // Handle regex patterns
      return new RegExp(allowed).test(origin);
    });

    return isAllowed ? origin : allowedOrigins[0];
  },
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-Environment", "X-Requested-With"],
  credentials: true,
  maxAge: 86400, // 24 hours
}));

// Add security headers
app.use("*", async (c, next) => {
  await next();

  // Security headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // CSP header (adjust based on your needs)
  if (process.env.NODE_ENV === 'production') {
    c.header('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none';");
  }
});

// Request logging middleware
app.use("*", async (c, next) => {
  const start = Date.now();
  const { method, url } = c.req;

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  console.log(`[${new Date().toISOString()}] ${method} ${url} ${status} ${duration}ms`);
});

// Health check endpoint
app.get("/", (c) => {
  return c.json({ 
    status: "ok", 
    message: "Heinicus API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// Debug endpoint to check tRPC routes
app.get("/debug/routes", (c) => {
  return c.json({
    message: "Available tRPC routes",
    routes: {
      "mechanic.submitVerification": "POST /api/trpc/mechanic.submitVerification",
      "mechanic.getVerificationStatus": "GET /api/trpc/mechanic.getVerificationStatus",
      "mechanic.getAllVerifications": "GET /api/trpc/mechanic.getAllVerifications",
      "mechanic.reviewVerification": "POST /api/trpc/mechanic.reviewVerification",
      "mechanic.getVerificationDetails": "GET /api/trpc/mechanic.getVerificationDetails"
    },
    timestamp: new Date().toISOString()
  });
});

// Mount tRPC router at /trpc
app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      console.error(`tRPC Error on ${path}:`, error);
    },
  })
);

// Catch-all for debugging
app.all("*", (c) => {
  console.log(`Unhandled request: ${c.req.method} ${c.req.url}`);
  return c.json({ 
    error: "Route not found",
    method: c.req.method,
    path: c.req.url,
    availableRoutes: ["/", "/debug/routes", "/trpc/*"]
  }, 404);
});

export default app;