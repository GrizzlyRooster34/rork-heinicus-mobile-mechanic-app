# PostgreSQL Setup - Manual Commands Reference

This document provides the exact shell commands for Steps 1 and 2 of the PostgreSQL setup.

## Step 1: Install PostgreSQL

Execute these commands to install PostgreSQL on Ubuntu:

```bash
# Update package lists
sudo apt-get update

# Install PostgreSQL and contrib packages
sudo apt-get install -y postgresql postgresql-contrib

# Start the PostgreSQL service
sudo systemctl start postgresql

# Enable PostgreSQL to start on boot
sudo systemctl enable postgresql

# Verify PostgreSQL is running
sudo systemctl status postgresql
```

## Step 2: Create Database and User

### Option A: Interactive Method

```bash
# Switch to the postgres user and open psql
sudo -u postgres psql

# Then run these SQL commands in the psql prompt:
CREATE USER heinicus_user WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE heinicus_db;
GRANT ALL PRIVILEGES ON DATABASE heinicus_db TO heinicus_user;
\c heinicus_db
GRANT ALL ON SCHEMA public TO heinicus_user;
\q
```

### Option B: Non-Interactive Method (Recommended)

```bash
# Create user and database in a single command
sudo -u postgres psql <<EOF
CREATE USER heinicus_user WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE heinicus_db;
GRANT ALL PRIVILEGES ON DATABASE heinicus_db TO heinicus_user;
\c heinicus_db
GRANT ALL ON SCHEMA public TO heinicus_user;
EOF
```

### Option C: Using the Automated Script

```bash
# Run the automated setup script
bash /home/ubuntu/setup_postgresql.sh
```

## Verification Commands

After setup, verify everything works:

```bash
# Check PostgreSQL version
psql --version

# Check if PostgreSQL is running
sudo systemctl status postgresql

# Test connection (replace password with your actual password)
PGPASSWORD="your_password" psql -U heinicus_user -d heinicus_db -h localhost -c "SELECT version();"

# List databases
sudo -u postgres psql -c "\l"

# List users/roles
sudo -u postgres psql -c "\du"
```

## Connection String Format

After creating the database and user, your connection string will be:

```
postgresql://heinicus_user:your_password@localhost:5432/heinicus_db
```

Add this to your `.env` file as:

```bash
DATABASE_URL="postgresql://heinicus_user:your_password@localhost:5432/heinicus_db"
```

## Troubleshooting

### If PostgreSQL fails to start:

```bash
# Check logs
sudo journalctl -u postgresql -n 50

# Restart the service
sudo systemctl restart postgresql
```

### If you need to reset the user password:

```bash
sudo -u postgres psql -c "ALTER USER heinicus_user WITH PASSWORD 'new_password';"
```

### If you need to drop and recreate the database:

```bash
sudo -u postgres psql <<EOF
DROP DATABASE IF EXISTS heinicus_db;
CREATE DATABASE heinicus_db;
GRANT ALL PRIVILEGES ON DATABASE heinicus_db TO heinicus_user;
\c heinicus_db
GRANT ALL ON SCHEMA public TO heinicus_user;
EOF
```
