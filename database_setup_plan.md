# Action Plan: Setting Up PostgreSQL and Prisma

This document outlines the immediate steps required to get the PostgreSQL database running and unblock schema migrations for the Rork Heinicus Mobile Mechanic App.

## 1. Install PostgreSQL

The first step is to install a PostgreSQL server in the development environment.

```bash
# Update package lists
sudo apt-get update

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Start and enable the PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## 2. Create a Database and User

Next, create a dedicated database and user for the application.

```bash
# Switch to the postgres user
sudo -u postgres psql

# Create a new user (replace 'your_password' with a strong password)
CREATE USER heinicus_user WITH PASSWORD 'your_password';

# Create the database
CREATE DATABASE heinicus_db;

# Grant all privileges on the database to the new user
GRANT ALL PRIVILEGES ON DATABASE heinicus_db TO heinicus_user;

# Exit psql
\q
```

## 3. Install Prisma

Install the Prisma CLI and Prisma Client as development dependencies in your project.

```bash
# Navigate to the project directory
cd /home/ubuntu/rork-heinicus-mobile-mechanic-app

# Install Prisma dependencies
bun add -d prisma
bun add @prisma/client
```

## 4. Initialize Prisma

Initialize Prisma in your project. This will create a `prisma` directory with a `schema.prisma` file.

```bash
# Initialize Prisma
npx prisma init
```

## 5. Configure Prisma for PostgreSQL

Update the `prisma/schema.prisma` file to connect to your new PostgreSQL database.

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## 6. Create a `.env` File

Create a `.env` file in the root of your project and add the `DATABASE_URL`.

```bash
# Create the .env file
touch .env

# Add the DATABASE_URL to the .env file
echo "DATABASE_URL=\"postgresql://heinicus_user:your_password@localhost:5432/heinicus_db\"" > .env
```

## 7. Update the Prisma Schema

Copy the schema definition from `backend/SECURITY_IMPLEMENTATION_NOTES.md` and paste it into your `prisma/schema.prisma` file. You will need to combine the existing `User` model with the new fields and add the new models.

## 8. Run Prisma Migrate

Create and apply the database migration.

```bash
npx prisma migrate dev --name init
```

This command will:

*   Create a new SQL migration file in the `prisma/migrations` directory.
*   Apply the migration to the database, creating the tables defined in your schema.

## 9. Generate Prisma Client

Generate the Prisma Client, which is a type-safe database client based on your schema.

```bash
npx prisma generate
```

## 10. Create the Prisma Client Instance

Create a file at `lib/prisma.ts` to instantiate and export the Prisma Client. This will provide a single, shared instance of the client throughout your application.

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
```

## 11. Refactor Backend Code

Finally, refactor the backend code in the `backend/trpc/routes` directory to use the Prisma Client for database operations instead of the current mock data and in-memory arrays. This will involve replacing the mock logic with actual database queries.
