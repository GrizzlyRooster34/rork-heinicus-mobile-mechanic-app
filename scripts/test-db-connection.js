#!/usr/bin/env node

/**
 * Database Connection Test Script
 *
 * This script tests the PostgreSQL database connection using the DATABASE_URL
 * from your .env file.
 *
 * Usage:
 *   1. Install dependencies: npm install pg dotenv
 *   2. Create .env file with DATABASE_URL (see .env.example)
 *   3. Run: node scripts/test-db-connection.js
 */

const { Client } = require('pg');
const path = require('path');

// Load environment variables from .env file
function loadEnv() {
  try {
    const fs = require('fs');
    const envPath = path.join(__dirname, '..', '.env');

    if (!fs.existsSync(envPath)) {
      console.error('❌ Error: .env file not found!');
      console.log('📝 Please create a .env file with your DATABASE_URL');
      console.log('💡 See .env.example for reference');
      process.exit(1);
    }

    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          let value = valueParts.join('=').trim();
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          process.env[key.trim()] = value;
        }
      }
    });
  } catch (error) {
    console.error('❌ Error loading .env file:', error.message);
    process.exit(1);
  }
}

// Test the database connection
async function testConnection() {
  console.log('🔌 Testing database connection...\n');

  // Load environment variables
  loadEnv();

  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL not found in .env file!');
    console.log('\n📝 Make sure your .env file contains:');
    console.log('   DATABASE_URL="postgresql://postgres:PASSWORD@HOST:5432/postgres"');
    console.log('\n💡 See DATABASE_SETUP.md for detailed instructions');
    process.exit(1);
  }

  // Validate the connection string format
  if (!DATABASE_URL.startsWith('postgresql://') && !DATABASE_URL.startsWith('postgres://')) {
    console.error('❌ Error: Invalid DATABASE_URL format!');
    console.log('   Expected: postgresql://postgres:PASSWORD@HOST:5432/postgres');
    console.log('   Got:', DATABASE_URL.substring(0, 30) + '...');
    process.exit(1);
  }

  // Check if password placeholder is still present
  if (DATABASE_URL.includes('YOUR_PASSWORD') || DATABASE_URL.includes('[YOUR-PASSWORD]')) {
    console.error('❌ Error: Please replace YOUR_PASSWORD with your actual database password!');
    console.log('\n📝 Steps to fix:');
    console.log('   1. Go to Supabase dashboard → Settings → Database');
    console.log('   2. Copy your connection string');
    console.log('   3. Replace [YOUR-PASSWORD] with your actual password');
    console.log('   4. Update DATABASE_URL in .env');
    process.exit(1);
  }

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for Supabase
    }
  });

  try {
    // Connect to database
    console.log('⏳ Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Run a simple query to verify
    console.log('⏳ Running test query...');
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');

    const { current_time, pg_version } = result.rows[0];
    console.log('✅ Query executed successfully!\n');

    // Display results
    console.log('📊 Connection Details:');
    console.log('─'.repeat(60));
    console.log(`📅 Server time:    ${current_time}`);
    console.log(`🐘 PostgreSQL:     ${pg_version.split(',')[0]}`);

    // Extract host from connection string (hide password)
    const url = new URL(DATABASE_URL);
    console.log(`🌐 Host:           ${url.hostname}`);
    console.log(`🔌 Port:           ${url.port || '5432'}`);
    console.log(`📦 Database:       ${url.pathname.substring(1) || 'postgres'}`);
    console.log('─'.repeat(60));

    console.log('\n🎉 Database connection test successful!');
    console.log('\n✅ Next steps:');
    console.log('   1. Set up Prisma ORM (Task HEI-134)');
    console.log('   2. Define your database schema');
    console.log('   3. Run migrations to create tables');
    console.log('   4. Start using persistent storage!\n');

  } catch (error) {
    console.error('\n❌ Connection failed!\n');
    console.error('Error details:');
    console.error('─'.repeat(60));
    console.error(`Type:    ${error.code || 'UNKNOWN'}`);
    console.error(`Message: ${error.message}`);
    console.error('─'.repeat(60));

    console.log('\n🔍 Troubleshooting tips:');
    console.log('   1. Verify DATABASE_URL in .env is correct');
    console.log('   2. Check your database password');
    console.log('   3. Ensure your Supabase project is active');
    console.log('   4. Check if your IP is allowed (Supabase allows all by default)');
    console.log('   5. See DATABASE_SETUP.md for detailed troubleshooting\n');

    process.exit(1);
  } finally {
    // Always close the connection
    await client.end();
  }
}

// Run the test
testConnection().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
