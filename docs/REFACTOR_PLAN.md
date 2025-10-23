# Backend Refactoring Plan

This document outlines the plan to refactor the backend to align with the project specification. The goal is to create a solid, reliable, and maintainable foundation for the application.

## 1. Goals

*   Align the Prisma database schema with the `data_models` in the specification.
*   Implement the tRPC API to match the `api_surface` and `business_rules` in the specification.
*   Replace all mock implementations with actual database logic.
*   Establish a correct and robust "request -> quote -> job" application flow.

## 2. Phase 1: Data Model Refactoring (Prisma)

The `prisma/schema.prisma` file needs to be significantly modified to match the specification. This will likely be a breaking change that requires a database reset.

### 2.1. Add Missing Models

The following models from the specification are missing and need to be added:

*   `Service`: To store the different types of services offered, their pricing, and estimated duration.
*   `PricingProfile`: To manage mechanic-specific pricing and discounts.
*   `NotificationPref`: To manage user notification preferences.
*   `AnalyticsSnapshot`: To store periodic analytics data.

### 2.2. Modify Existing Models

The following models need to be modified to match the fields and relationships in the specification:

*   **User:** Simplify to match the spec, or integrate the existing `CustomerProfile`, `MechanicProfile`, and `AdminProfile` more formally.
*   **Quote:** Add `line_items`, `labor_rate`, `est_hours`, `travel_fee`, and `discounts_applied` to support the `quote_calculation` business rule.
*   **Job:** Add `parts_used` and `timers` to track job details accurately.
*   **Availability:** Refactor `MechanicAvailability` to match the `Availability` model in the spec.

### 2.3. Database Migration

1.  After the schema is updated, generate a new Prisma migration:
    ```bash
    npx prisma migrate dev --name "refactor-to-spec"
    ```
2.  This will likely require a database reset. The development database should be reset to apply the new schema.

## 3. Phase 2: API Layer Refactoring (tRPC)

With the new database schema in place, the tRPC API needs to be refactored to use the new models and implement the correct business logic.

### 3.1. Update Routers

*   **`quoteRouter`:**
    *   Replace the mock `create` procedure with one that uses the new `Quote` model and the `quote_calculation` business rule.
    *   Replace the mock `approve` procedure with one that creates a `Job` record.
*   **`jobRouter`:**
    *   Refactor the `create` procedure to be a `request` procedure that initiates the "request -> quote -> job" flow.
    *   Implement separate procedures for `accept`, `start`, and `complete` that correctly update the job status.
*   **New Routers:**
    *   Create a `serviceRouter` to expose the new `Service` model (`GET /services`).
    *   Create a `reportsRouter` to expose the `AnalyticsSnapshot` model (`GET /reports/summary`).

### 3.2. Remove Mock Implementations

All procedures that currently use in-memory storage (`Map`) or return mock data must be rewritten to use the Prisma client to interact with the database.

## 4. Phase 3: Business Logic Implementation

The core business rules from the specification need to be implemented in the API layer.

*   **Quote Calculation:** Implement the `quote_calculation` formula in the `quoteRouter`.
*   **Auto-Acceptance:** Implement the `auto_accept_criteria` logic when a new job is created.
*   **Job Status Flow:** Enforce the correct state transitions for jobs as defined in `job_status_flow`.
*   **Notifications:** Implement the notification logic as defined in the `notifications` section of the spec.

## 5. Phase 4: Validation

After the refactoring is complete, the backend must be thoroughly validated.

1.  **Run the test suite:** Once the test environment is fixed, all existing and new tests must pass.
2.  **Write new tests:** Create new unit and integration tests to cover the refactored code and new business logic.
3.  **Manual API testing:** Manually test all API endpoints to ensure they behave as expected.
4.  **E2E testing:** Run through the `acceptance_tests` from the specification to ensure the end-to-end flows are working correctly.
