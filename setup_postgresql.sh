#!/bin/bash

# PostgreSQL Setup Script for Heinicus Mobile Mechanic App
# This script installs PostgreSQL and creates the required database and user

set -e  # Exit on any error

echo "=========================================="
echo "PostgreSQL Setup for Heinicus App"
echo "=========================================="
echo ""

# Step 1: Install PostgreSQL
echo "Step 1: Installing PostgreSQL..."
sudo apt-get update -qq
sudo apt-get install -y postgresql postgresql-contrib

# Step 2: Start PostgreSQL service
echo "Step 2: Starting PostgreSQL service..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify PostgreSQL is running
echo "Step 3: Verifying PostgreSQL is running..."
sudo systemctl status postgresql --no-pager | head -5

# Step 4: Create database and user
echo ""
echo "Step 4: Creating database and user..."

# Generate a secure random password
DB_PASSWORD="heinicus_$(openssl rand -hex 16)"

# Create the SQL commands
sudo -u postgres psql <<EOF
-- Create the user
CREATE USER heinicus_user WITH PASSWORD '$DB_PASSWORD';

-- Create the database
CREATE DATABASE heinicus_db;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE heinicus_db TO heinicus_user;

-- Grant schema privileges (required for PostgreSQL 15+)
\c heinicus_db
GRANT ALL ON SCHEMA public TO heinicus_user;

-- Display confirmation
\du heinicus_user
\l heinicus_db
EOF

# Step 5: Save connection details
echo ""
echo "Step 5: Saving connection details..."

# Create the DATABASE_URL
DATABASE_URL="postgresql://heinicus_user:${DB_PASSWORD}@localhost:5432/heinicus_db"

# Save to a secure file
echo "DATABASE_URL=\"${DATABASE_URL}\"" > /home/ubuntu/rork-heinicus-mobile-mechanic-app/.env.db

echo ""
echo "=========================================="
echo "✅ PostgreSQL Setup Complete!"
echo "=========================================="
echo ""
echo "Database: heinicus_db"
echo "User: heinicus_user"
echo "Password: $DB_PASSWORD"
echo ""
echo "Connection string saved to: .env.db"
echo "DATABASE_URL=\"${DATABASE_URL}\""
echo ""
echo "⚠️  IMPORTANT: Save the password above securely!"
echo "=========================================="
