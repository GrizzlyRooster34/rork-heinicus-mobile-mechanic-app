#!/usr/bin/env tsx

/**
 * WebSocket Server Entry Point
 *
 * Start the WebSocket server for real-time features
 * Run with: npx tsx backend/websocket/index.ts
 */

import 'dotenv/config';
import { startWebSocketServer } from './server';

console.log('🚀 Starting Heinicus WebSocket Server...');
console.log('='.repeat(60));

// Start the WebSocket server
startWebSocketServer();

console.log('='.repeat(60));
console.log('✅ WebSocket server ready for connections');
console.log('   Press Ctrl+C to stop the server');
