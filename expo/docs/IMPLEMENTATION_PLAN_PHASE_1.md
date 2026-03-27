# Phase 1 Implementation Plan: Data Model Refactoring

This document provides a step-by-step guide for refactoring the Prisma database schema to align with the project specification.

## 1. Introduction

The goal of this phase is to create a database schema that accurately reflects the business requirements of the application. This involves adding missing models, modifying existing ones, and establishing a clean data foundation for the API and frontend.

## 2. Step-by-Step Schema Changes

The following changes should be made to the `prisma/schema.prisma` file. It is recommended to replace the existing content with the schema below to ensure all changes are applied correctly.

### 2.1. The New `schema.prisma`

```prisma
// This is your new schema.prisma file

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// --- Core Models ---

model User {
  id        String   @id @default(cuid())
  role      UserRole
  firstName String
  lastName  String
  email     String   @unique
  phone     String?
  address   String?
  joinedAt  DateTime @default(now())

  // Relations
  vehicles          Vehicle[]
  quotes            Quote[]
  jobsAsCustomer    Job[]             @relation("CustomerJobs")
  jobsAsMechanic    Job[]             @relation("MechanicJobs")
  notificationPrefs NotificationPref? 
  pricingProfile    PricingProfile?   
  availability      Availability?     
}

model Vehicle {
  id      String  @id @default(cuid())
  userId  String
  user    User    @relation(fields: [userId], references: [id])
  vin     String? @unique
  year    Int?
  make    String?
  model   String?
  notes   String?

  // Relations
  quotes Quote[]
}

model Service {
  id                 String  @id @default(cuid())
  name               String
  category           String
  basePrice          Float
  defaultLaborRate   Float
  estHours           Float
  requiredTools      String[]

  // Relations
  quotes Quote[]
}

model Quote {
  id              String   @id @default(cuid())
  customerId      String
  customer        User     @relation(fields: [customerId], references: [id])
  vehicleId       String
  vehicle         Vehicle  @relation(fields: [vehicleId], references: [id])
  serviceId       String
  service         Service  @relation(fields: [serviceId], references: [id])
  lineItems       Json     // Store as JSON: [{ label: string, amount: number }]
  laborRate       Float
  estHours        Float
  travelFee       Float
  discountsApplied Json    // Store as JSON: [{ type: string, pct: number, amount: number }]
  status          QuoteStatus @default(PENDING)
  subtotal        Float
  taxes           Float?
  total           Float

  // Relations
  job Job?
}

model Job {
  id          String   @id @default(cuid())
  quoteId     String   @unique
  quote       Quote    @relation(fields: [quoteId], references: [id])
  customerId  String
  customer    User     @relation("CustomerJobs", fields: [customerId], references: [id])
  mechanicId  String?
  mechanic    User?    @relation("MechanicJobs", fields: [mechanicId], references: [id])
  status      JobStatus @default(PENDING)
  urgency     UrgencyLevel
  schedule    Json?    // Store as JSON: { start: datetime, end?: datetime }
  location    Json     // Store as JSON: { lat: number, lng: number, address?: string }
  photos      String[]
  partsUsed   Json     // Store as JSON: [{ name: string, qty: number, unit_cost: number }]
  timers      Json     // Store as JSON: [{ start: datetime, end?: datetime }]
  totals      Json     // Store as JSON: { labor: number, parts: number, fees: number, discounts: number, grand_total: number }
  rating      Json?    // Store as JSON: { stars: number, review?: string }
}

// --- Supporting Models ---

model PricingProfile {
  id            String @id @default(cuid())
  mechanicId    String @unique
  mechanic      User   @relation(fields: [mechanicId], references: [id])
  generalRates  Json   // Store as JSON: { standard: number, emergency: number, travel_fee: number, minimum: number }
  discounts     Json   // Store as JSON: { senior_pct: number, military_pct: number, repeat_pct: number }
}

model Availability {
  id                  String   @id @default(cuid())
  mechanicId          String   @unique
  mechanic            User     @relation(fields: [mechanicId], references: [id])
  daysEnabled         String[]
  startTime           String   // "HH:mm"
  endTime             String   // "HH:mm"
  maxJobsPerDay       Int
  travelRadiusMiles   Int
  autoAccept          Boolean
  emergencyEnabled    Boolean
}

model Tool {
  id        String   @id @default(cuid())
  name      String
  category  String
  required  Boolean
  available Boolean
  notes     String?
}

model NotificationPref {
  id          String  @id @default(cuid())
  userId      String  @unique
  user        User    @relation(fields: [userId], references: [id])
  jobUpdates  Boolean
  maintenance Boolean
  promos      Boolean
  emergency   Boolean
  quietHours  Json?   // Store as JSON: { start: "HH:mm", end: "HH:mm" }
}

model AnalyticsSnapshot {
  id          String @id @default(cuid())
  period      String // "week", "month", "quarter", "year"
  totals      Json
  breakdown   Json
  topServices Json?
}

// --- Enums ---

enum UserRole {
  CUSTOMER
  MECHANIC
  ADMIN
}

enum QuoteStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
}

enum JobStatus {
  PENDING
  ACTIVE
  COMPLETED
  CANCELED
}

enum UrgencyLevel {
  LOW
  MEDIUM
  HIGH
  EMERGENCY
}

```

### 2.2. Summary of Changes

*   **Added `Service`, `PricingProfile`, `Availability`, `Tool`, `NotificationPref`, `AnalyticsSnapshot`:** These models are added as defined in the specification.
*   **Simplified `User`:** The `User` model is simplified to match the spec, and the profile-specific fields are moved to the `PricingProfile` and `Availability` models for mechanics.
*   **Refactored `Quote` and `Job`:** These models are updated with the correct fields, using the `Json` type for nested objects to match the spec.
*   **Removed Extra Models:** The previous complex profile models and other extra tables are removed to simplify the schema and align it with the plan.

## 3. Migration Strategy

Given the extensive changes to the schema, a clean migration is the best approach. This will involve resetting the development database.

1.  **Replace the content** of `prisma/schema.prisma` with the new schema provided above.
2.  **Generate a new migration:**
    ```bash
    npx prisma migrate dev --name "refactor-to-spec-v1"
    ```
    *   Prisma will detect the changes and prompt you to reset the database. Confirm this action.
3.  **Generate the Prisma Client:**
    ```bash
    npx prisma generate
    ```

This process will create a new, clean database that matches the specification.

## 4. Data Seeding

After the migration, the database will be empty. A seed script should be created to populate it with the necessary demo data.

1.  **Create a `prisma/seed.ts` file.** This file will contain the logic to create the seed data.
2.  **Add a `seed` script** to your `package.json`:
    ```json
    "prisma": {
      "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
    }
    ```
3.  **Run the seed script:**
    ```bash
    npx prisma db seed
    ```

I will create the `prisma/seed.ts` file in the next step.

## 5. Validation Checkpoints

After the migration and seeding are complete, your team should perform the following checks:

1.  **Inspect the database:** Connect to the PostgreSQL database and verify that the new tables and columns have been created correctly.
2.  **Query the seed data:** Run `SELECT * FROM "User";` and other queries to ensure the seed data has been inserted correctly.
3.  **Check Prisma Studio:** Run `npx prisma studio` to get a web UI for viewing and editing your data. Verify that all models and data appear as expected.
4.  **Type Check:** Ensure that the new Prisma client can be imported and used in your tRPC routers without any type errors.

```