# Database Setup Guide - PostgreSQL with Supabase

This guide will walk you through setting up a PostgreSQL database using Supabase for the Heinicus Mobile Mechanic app.

## Why Supabase?

Supabase is an open-source Firebase alternative that provides:
- **Free PostgreSQL database** (500 MB storage, unlimited API requests on free tier)
- **Built-in authentication** (if needed for future features)
- **Realtime subscriptions** (useful for live job updates)
- **Storage buckets** (for future image uploads)
- **Auto-generated REST API** (backup to tRPC if needed)
- **Connection pooling** built-in with PgBouncer

## Prerequisites

- A GitHub, GitLab, or Bitbucket account (for Supabase login)
- Node.js installed (for running the connection test)

---

## Step 1: Create a Supabase Account and Project

### 1.1 Sign Up for Supabase

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign In"**
3. Sign in with your GitHub, GitLab, or Bitbucket account

### 1.2 Create a New Project

1. Once logged in, click **"New Project"**
2. Fill in the project details:
   - **Name**: `heinicus-mobile-mechanic` (or your preferred name)
   - **Database Password**: Generate a strong password (save this securely!)
   - **Region**: Choose the region closest to your users/servers
   - **Pricing Plan**: Select **"Free"** to start

3. Click **"Create new project"**
4. Wait 1-2 minutes for Supabase to provision your database

> **⚠️ IMPORTANT**: Save your database password immediately! You'll need it for the connection string. Supabase does not show it again after project creation.

---

## Step 2: Get Your Database Connection String

### 2.1 Navigate to Database Settings

1. In your Supabase dashboard, click on your project
2. Go to **Settings** (gear icon in left sidebar)
3. Click **"Database"** in the settings menu

### 2.2 Find the Connection String

1. Scroll down to the **"Connection string"** section
2. Select the **"URI"** tab (not "Transaction" or "Session")
3. You'll see a connection string that looks like:

```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

4. **Replace `[YOUR-PASSWORD]` with your actual database password**

### 2.3 Add Connection Pooling Parameters

For optimal performance with Prisma and serverless environments, modify the connection string:

**Standard connection string (direct):**
```
postgresql://postgres:YOUR_PASSWORD@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

**With connection pooling (recommended for production):**
```
postgresql://postgres:YOUR_PASSWORD@db.xxxxxxxxxxxxx.supabase.co:6543/postgres?pgbouncer=true
```

**For serverless/Vercel deployments:**
```
postgresql://postgres:YOUR_PASSWORD@db.xxxxxxxxxxxxx.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1
```

> **Note**:
> - Port **5432** = Direct connection (use for migrations)
> - Port **6543** = Connection pooling via PgBouncer (use for application queries)

---

## Step 3: Configure Your Application

### 3.1 Create a `.env` File

In the root of your project, create a `.env` file:

```bash
# .env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxxxxxxxxxx.supabase.co:5432/postgres"
```

**Replace with your actual connection string from Step 2!**

### 3.2 For Prisma (Next Task)

When you set up Prisma in the next step (HEI-134), you may need two connection strings:

```bash
# .env
# Direct connection for migrations (port 5432)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxxxxxxxxxx.supabase.co:5432/postgres"

# Pooled connection for Prisma Client queries (port 6543)
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxxxxxxxxxx.supabase.co:5432/postgres"
```

---

## Step 4: Test Your Database Connection

### 4.1 Install the PostgreSQL Client

```bash
npm install pg
# or
yarn add pg
# or
bun add pg
```

### 4.2 Run the Connection Test Script

We've provided a test script in `scripts/test-db-connection.js`. Run it:

```bash
node scripts/test-db-connection.js
```

**Expected output:**
```
🔌 Testing database connection...
✅ Database connection successful!
📅 Server time: 2025-11-18T10:30:45.123Z
🎉 Your database is ready to use!
```

If you see errors, check:
- Your DATABASE_URL is correct in `.env`
- Your password is correct
- Your IP is not blocked (Supabase allows all IPs by default)

---

## Security Best Practices

### ✅ DO:
- ✅ Store database credentials in `.env` (already gitignored)
- ✅ Use environment variables in production (Vercel, Railway, etc.)
- ✅ Use connection pooling (`?pgbouncer=true`) in production
- ✅ Rotate your database password periodically
- ✅ Use read-only users for analytics/reporting tools

### ❌ DON'T:
- ❌ Commit `.env` to version control
- ❌ Share your database password in Slack, Discord, or public channels
- ❌ Use the same password across multiple projects
- ❌ Hardcode credentials in your application code
- ❌ Expose your database password in client-side code

---

## Connection String Parameters Explained

| Parameter | Description | When to Use |
|-----------|-------------|-------------|
| `pgbouncer=true` | Enables connection pooling | Production environments, serverless |
| `connection_limit=1` | Limits connections per pool | Serverless (Vercel, Netlify) |
| `sslmode=require` | Enforces SSL connections | High-security requirements |
| `schema=public` | Specifies database schema | Multi-tenant apps |

**Recommended for most apps:**
```
?pgbouncer=true&connection_limit=1
```

---

## Troubleshooting

### Issue: "Connection refused" or "timeout"

**Possible causes:**
- Incorrect host/port in connection string
- Database not fully provisioned (wait 2-3 minutes after creation)
- Network firewall blocking port 5432 or 6543

**Solution:**
1. Double-check your connection string from Supabase dashboard
2. Ensure your project status is "Active" (not "Paused")
3. Try pinging the host: `ping db.xxxxxxxxxxxxx.supabase.co`

### Issue: "password authentication failed"

**Possible causes:**
- Wrong password in connection string
- Special characters in password not URL-encoded

**Solution:**
1. Reset your database password in Supabase → Settings → Database → "Database Settings"
2. If your password contains special characters (`@`, `#`, `%`, etc.), URL-encode them:
   - `@` → `%40`
   - `#` → `%23`
   - `%` → `%25`

### Issue: "too many connections"

**Possible causes:**
- Not using connection pooling
- Too many direct connections (5432)

**Solution:**
1. Use port 6543 with `?pgbouncer=true`
2. Close unused connections in your code
3. Use Prisma's connection pooling (next task)

---

## Next Steps

Once your database connection is working:

1. **✅ Verify connection** using `scripts/test-db-connection.js`
2. **📦 Set up Prisma ORM** (Task HEI-134)
   - Initialize Prisma
   - Define your schema (User, Job, Quote, Mechanic, etc.)
   - Run migrations to create tables
3. **🔄 Migrate data** from in-memory arrays to database
4. **🔐 Implement real authentication** using database-backed users

---

## Supabase Dashboard Features

Your Supabase dashboard includes useful tools:

- **Table Editor**: View and edit data directly (like phpMyAdmin)
- **SQL Editor**: Run custom SQL queries
- **Database**: Monitor connections, extensions, replication
- **API**: Auto-generated REST endpoints for tables
- **Auth**: User authentication (optional, can use later)
- **Storage**: File uploads (for vehicle photos, invoices, etc.)
- **Logs**: Query logs and error tracking

Access your dashboard at: `https://app.supabase.com/project/YOUR_PROJECT_ID`

---

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase + Prisma Guide](https://supabase.com/docs/guides/integrations/prisma)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
- [Prisma Connection Management](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)

---

## Support

If you run into issues:
1. Check the [Supabase Discord](https://discord.supabase.com)
2. Review [Supabase GitHub Discussions](https://github.com/supabase/supabase/discussions)
3. Check Prisma's [troubleshooting guide](https://www.prisma.io/docs/guides/database/troubleshooting-orm)

---

**✅ Database setup complete! You're ready for Prisma integration.**
