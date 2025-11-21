#!/usr/bin/env tsx

/**
 * Backend HTTP Server Entry Point
 *
 * Starts the Hono server with tRPC routes for the Heinicus Mobile Mechanic API
 * Run with: npm run backend
 */

import 'dotenv/config';
import { serve } from '@hono/node-server';
import app from './hono';

const PORT = parseInt(process.env.PORT || '3000', 10);

console.log('🚀 Starting Heinicus API Server...');
console.log('='.repeat(60));
console.log(`📡 Server starting on http://localhost:${PORT}`);
console.log(`🔌 tRPC endpoint: http://localhost:${PORT}/api/trpc`);
console.log(`💳 Payment routes: http://localhost:${PORT}/api/payment`);
console.log(`🔍 Debug routes: http://localhost:${PORT}/api/debug`);
console.log('='.repeat(60));

serve({
  fetch: app.fetch,
  port: PORT,
}, (info) => {
  console.log(`✅ Server is running on http://localhost:${info.port}`);
  console.log('');
  console.log('Available endpoints:');
  console.log(`  - tRPC API: http://localhost:${info.port}/api/trpc`);
  console.log(`  - Payment:  http://localhost:${info.port}/api/payment`);
  console.log(`  - Debug:    http://localhost:${info.port}/api/debug/routes`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to log this to a service like Sentry
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // In production, log to error tracking service, then exit gracefully
  process.exit(1);
});
