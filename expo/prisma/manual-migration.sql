-- Manual SQL migration for Prisma schema (Termux/Android workaround)
-- Generated from prisma/schema.prisma

-- Create ENUMS
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'MECHANIC', 'ADMIN');
CREATE TYPE "QuoteStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELED');
CREATE TYPE "UrgencyLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY');

-- Create tables
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" "UserRole" NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "phone" TEXT,
    "address" TEXT,
    "joinedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "vin" TEXT UNIQUE,
    "year" INTEGER,
    "make" TEXT,
    "model" TEXT,
    "notes" TEXT,
    FOREIGN KEY ("userId") REFERENCES "User"("id")
);

CREATE TABLE "Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "defaultLaborRate" DOUBLE PRECISION NOT NULL,
    "estHours" DOUBLE PRECISION NOT NULL,
    "requiredTools" TEXT[]
);

CREATE TABLE "Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "lineItems" JSONB NOT NULL,
    "laborRate" DOUBLE PRECISION NOT NULL,
    "estHours" DOUBLE PRECISION NOT NULL,
    "travelFee" DOUBLE PRECISION NOT NULL,
    "discountsApplied" JSONB NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" DOUBLE PRECISION NOT NULL,
    "taxes" DOUBLE PRECISION,
    "total" DOUBLE PRECISION NOT NULL,
    FOREIGN KEY ("customerId") REFERENCES "User"("id"),
    FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id"),
    FOREIGN KEY ("serviceId") REFERENCES "Service"("id")
);

CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL UNIQUE,
    "customerId" TEXT NOT NULL,
    "mechanicId" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "urgency" "UrgencyLevel" NOT NULL,
    "schedule" JSONB,
    "location" JSONB NOT NULL,
    "photos" TEXT[],
    "partsUsed" JSONB NOT NULL,
    "timers" JSONB NOT NULL,
    "totals" JSONB NOT NULL,
    "rating" JSONB,
    FOREIGN KEY ("quoteId") REFERENCES "Quote"("id"),
    FOREIGN KEY ("customerId") REFERENCES "User"("id"),
    FOREIGN KEY ("mechanicId") REFERENCES "User"("id")
);

CREATE TABLE "PricingProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mechanicId" TEXT NOT NULL UNIQUE,
    "generalRates" JSONB NOT NULL,
    "discounts" JSONB NOT NULL,
    FOREIGN KEY ("mechanicId") REFERENCES "User"("id")
);

CREATE TABLE "Availability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mechanicId" TEXT NOT NULL UNIQUE,
    "daysEnabled" TEXT[],
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "maxJobsPerDay" INTEGER NOT NULL,
    "travelRadiusMiles" INTEGER NOT NULL,
    "autoAccept" BOOLEAN NOT NULL,
    "emergencyEnabled" BOOLEAN NOT NULL,
    FOREIGN KEY ("mechanicId") REFERENCES "User"("id")
);

CREATE TABLE "Tool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL,
    "available" BOOLEAN NOT NULL,
    "notes" TEXT
);

CREATE TABLE "NotificationPref" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "jobUpdates" BOOLEAN NOT NULL,
    "maintenance" BOOLEAN NOT NULL,
    "promos" BOOLEAN NOT NULL,
    "emergency" BOOLEAN NOT NULL,
    "quietHours" JSONB,
    FOREIGN KEY ("userId") REFERENCES "User"("id")
);

CREATE TABLE "AnalyticsSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period" TEXT NOT NULL,
    "totals" JSONB NOT NULL,
    "breakdown" JSONB NOT NULL,
    "topServices" JSONB
);

-- Create Prisma migration tracking table
CREATE TABLE "_prisma_migrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "checksum" TEXT NOT NULL,
    "finished_at" TIMESTAMP,
    "migration_name" TEXT NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMP,
    "started_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);

-- Insert migration record
INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "applied_steps_count", "finished_at")
VALUES
('manual-migration-001', 'manual-migration-checksum', 'manual_migration_refactor_to_spec_v1', 1, CURRENT_TIMESTAMP);
