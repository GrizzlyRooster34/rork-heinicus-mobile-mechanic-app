# Database Setup Guide

This guide walks you through setting up the PostgreSQL database for the Rork Heinicus Mobile Mechanic App.

## Prerequisites

- PostgreSQL 14+ installed
- Node.js 16+ installed
- npm 8+ installed

## Local Development Setup

### 1. Install PostgreSQL

#### macOS (using Homebrew)
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

####Windows
Download and install from: https://www.postgresql.org/download/windows/

### 2. Create Database and User

```bash
# Connect to PostgreSQL as superuser
psql postgres

# Create database
CREATE DATABASE mobile_mechanic_dev;

# Create user with password
CREATE USER mechanic_user WITH PASSWORD 'your_secure_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE mobile_mechanic_dev TO mechanic_user;

# Exit psql
\q
```

### 3. Configure Environment Variables

Create or update `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://mechanic_user:your_secure_password_here@localhost:5432/mobile_mechanic_dev?schema=public"

# Optional: Separate connection pool URL (for production)
# CONNECTION_POOL_URL="postgresql://mechanic_user:your_secure_password_here@localhost:5432/mobile_mechanic_dev?schema=public&pgbouncer=true"
```

### 4. Run Prisma Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name initial_schema

# Verify migration
npx prisma migrate status
```

### 5. Seed the Database

```bash
# Run seed script
npx prisma db seed

# Or use npm script
npm run db:seed
```

You should see output like:
```
🌱 Starting comprehensive database seeding...
✅ Cleared existing data
✅ Created admin user: matthew.heinen.2014@gmail.com
✅ Created 3 mechanics with profiles
✅ Created 5 customers
✅ Created 6 services
✅ Created 5 vehicles
✅ Created 2 sample quotes
✅ Created 1 completed job with timeline
✅ Created payment record
✅ Created review
✅ Created system settings

🎉 Database seeding completed successfully!
```

### 6. Verify Setup

```bash
# Open Prisma Studio to view data
npx prisma studio
```

This will open a browser at `http://localhost:5555` where you can view and edit database records.

## Production Setup

### Option 1: Managed PostgreSQL (Recommended)

#### Supabase (Free Tier Available)
1. Sign up at https://supabase.com
2. Create new project
3. Copy connection string from Settings → Database
4. Update `DATABASE_URL` in production environment

#### AWS RDS
1. Create PostgreSQL instance in AWS RDS
2. Configure security groups to allow connections
3. Copy endpoint URL
4. Format: `postgresql://username:password@endpoint:5432/dbname`

#### DigitalOcean Managed Databases
1. Create PostgreSQL database cluster
2. Add your server's IP to trusted sources
3. Copy connection string
4. Update `DATABASE_URL`

### Option 2: Self-Hosted PostgreSQL

```bash
# Install PostgreSQL on production server
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create production database
sudo -u postgres psql
CREATE DATABASE mobile_mechanic_prod;
CREATE USER mechanic_prod_user WITH PASSWORD 'strong_production_password';
GRANT ALL PRIVILEGES ON DATABASE mobile_mechanic_prod TO mechanic_prod_user;
\q

# Configure PostgreSQL for remote connections (if needed)
sudo nano /etc/postgresql/14/main/postgresql.conf
# Set: listen_addresses = '*'

sudo nano /etc/postgresql/14/main/pg_hba.conf
# Add: host mobile_mechanic_prod mechanic_prod_user 0.0.0.0/0 md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Connection Pooling (Production)

For production with high traffic, use connection pooling:

#### Option 1: PgBouncer
```bash
# Install PgBouncer
sudo apt install pgbouncer

# Configure /etc/pgbouncer/pgbouncer.ini
[databases]
mobile_mechanic_prod = host=localhost port=5432 dbname=mobile_mechanic_prod

[pgbouncer]
listen_port = 6432
listen_addr = 127.0.0.1
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20

# Start PgBouncer
sudo systemctl start pgbouncer
sudo systemctl enable pgbouncer

# Update DATABASE_URL to use port 6432
DATABASE_URL="postgresql://mechanic_prod_user:password@localhost:6432/mobile_mechanic_prod"
```

#### Option 2: Prisma Connection Pooling
Prisma has built-in connection pooling. Configure in `schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  pool_timeout = 20
  pool_size = 10
}
```

## Database Migrations

### Creating a New Migration

```bash
# Make changes to prisma/schema.prisma
# Then create migration
npx prisma migrate dev --name add_new_feature

# This will:
# 1. Create SQL migration file
# 2. Apply migration to database
# 3. Regenerate Prisma Client
```

### Applying Migrations in Production

```bash
# IMPORTANT: Always test migrations in staging first!

# Preview migration without applying
npx prisma migrate deploy --preview-feature

# Apply pending migrations
npx prisma migrate deploy

# Verify migration status
npx prisma migrate status
```

### Rolling Back a Migration

Prisma doesn't have built-in rollback. To roll back:

1. Create a new migration that reverses the changes
2. Or restore from database backup

```bash
# Example: Rollback by creating reverse migration
# Edit prisma/schema.prisma to remove the changes
npx prisma migrate dev --name rollback_feature_name
```

## Backup and Restore

### Automated Backups

#### Using pg_dump (Daily Backups)
```bash
# Create backup script: /home/mechanic/backup-db.sh
#!/bin/bash
DATE=$(date +%Y-%m-%d-%H-%M)
BACKUP_DIR="/home/mechanic/backups"
DB_NAME="mobile_mechanic_prod"
DB_USER="mechanic_prod_user"

mkdir -p $BACKUP_DIR
pg_dump -U $DB_USER -F c $DB_NAME > $BACKUP_DIR/backup-$DATE.dump

# Keep only last 30 days of backups
find $BACKUP_DIR -type f -name "backup-*.dump" -mtime +30 -delete

# Make executable
chmod +x /home/mechanic/backup-db.sh

# Add to crontab (runs daily at 2 AM)
crontab -e
0 2 * * * /home/mechanic/backup-db.sh
```

#### Using Managed Database Backups
- **Supabase**: Automatic daily backups (free tier: 7 days retention)
- **AWS RDS**: Automated backups with point-in-time recovery
- **DigitalOcean**: Automated daily backups

### Manual Backup

```bash
# Backup entire database
pg_dump -U mechanic_user -F c mobile_mechanic_dev > backup.dump

# Backup with compression
pg_dump -U mechanic_user -F c mobile_mechanic_dev | gzip > backup.dump.gz

# Backup specific tables
pg_dump -U mechanic_user -t users -t jobs mobile_mechanic_dev > partial_backup.sql
```

### Restore from Backup

```bash
# Restore from custom format dump
pg_restore -U mechanic_user -d mobile_mechanic_dev backup.dump

# Restore from compressed dump
gunzip -c backup.dump.gz | pg_restore -U mechanic_user -d mobile_mechanic_dev

# Restore from SQL file
psql -U mechanic_user -d mobile_mechanic_dev < backup.sql

# Drop and recreate database before restore (CAREFUL!)
dropdb -U mechanic_user mobile_mechanic_dev
createdb -U mechanic_user mobile_mechanic_dev
pg_restore -U mechanic_user -d mobile_mechanic_dev backup.dump
```

## Monitoring and Maintenance

### Check Database Size

```sql
-- Total database size
SELECT pg_size_pretty(pg_database_size('mobile_mechanic_dev'));

-- Size per table
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Active Connections

```sql
SELECT
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query
FROM pg_stat_activity
WHERE datname = 'mobile_mechanic_dev';
```

### Slow Query Monitoring

```sql
-- Enable slow query logging in postgresql.conf
-- log_min_duration_statement = 1000  # Log queries slower than 1 second

-- View slow queries
SELECT
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Vacuum and Analyze

```bash
# Full vacuum (reclaims space)
vacuumdb -U mechanic_user --full mobile_mechanic_dev

# Analyze (updates statistics)
vacuumdb -U mechanic_user --analyze mobile_mechanic_dev

# Both together
vacuumdb -U mechanic_user --full --analyze mobile_mechanic_dev
```

## Troubleshooting

### Connection Refused

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check listening ports
sudo netstat -plunt | grep postgres

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Too Many Connections

```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Check max connections
SHOW max_connections;

-- Increase max connections (edit postgresql.conf)
max_connections = 200

-- Restart PostgreSQL
sudo systemctl restart postgresql
```

### Migration Conflicts

```bash
# Check migration status
npx prisma migrate status

# Mark migration as applied (if already applied manually)
npx prisma migrate resolve --applied <migration_name>

# Mark migration as rolled back
npx prisma migrate resolve --rolled-back <migration_name>
```

### Permission Denied

```sql
-- Grant all privileges on all tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mechanic_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO mechanic_user;

-- Make user owner of database
ALTER DATABASE mobile_mechanic_dev OWNER TO mechanic_user;
```

## Security Best Practices

1. **Use strong passwords**
   - Minimum 16 characters
   - Mix of letters, numbers, symbols
   - Never commit passwords to version control

2. **Limit network access**
   - Use firewall rules
   - Only allow connections from application servers
   - Use SSL/TLS for remote connections

3. **Regular backups**
   - Automated daily backups
   - Test restore procedure monthly
   - Store backups in different location

4. **Monitor access**
   - Enable logging
   - Review logs regularly
   - Alert on suspicious activity

5. **Keep PostgreSQL updated**
   - Apply security patches promptly
   - Subscribe to PostgreSQL security mailing list

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Database Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

## Support

For database setup issues:
- Check logs in `/var/log/postgresql/`
- Review Prisma logs (set `DEBUG=prisma:*`)
- Contact: matthew.heinen.2014@gmail.com
