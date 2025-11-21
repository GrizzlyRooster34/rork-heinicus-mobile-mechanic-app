# Explanation of the Database Schema

This document explains the current state of the Prisma database schema and how it differs from the provided specification.

## 1. Current Prisma Schema Overview

The current schema, defined in `prisma/schema.prisma`, is a detailed and normalized data model that includes the following key models:

*   **User Management:** `User`, `CustomerProfile`, `MechanicProfile`, `AdminProfile`
*   **Core Operations:** `Vehicle`, `Job`, `Quote`, `QuotePart`
*   **Finances:** `Payment`
*   **Feedback:** `Review`
*   **Mechanic-specific:** `MechanicVerification`, `MechanicTool`, `MechanicAvailability`
*   **Real-time & Logging:** `JobTimeline`, `ChatMessage`, `Notification`

This schema is well-structured for a relational database and uses Prisma's features for relations and type safety at the database level.

## 2. Discrepancies from Specification

While the schema is robust, it has significant discrepancies from the `data_models` outlined in the project specification. These differences are critical and impact the application's ability to meet the specified business requirements.

### 2.1. Missing Models

The following models from the specification are completely missing from the database schema:

*   **`Service`**: This is the most critical missing piece. The specification relies on a `Service` model to define the types of services offered, their base prices, labor rates, and estimated hours. Without this model, the core pricing and quote generation logic cannot be implemented as specified.
*   **`PricingProfile`**: This model, intended to manage mechanic-specific pricing and discounts, is also missing. This prevents the implementation of flexible pricing based on the mechanic.
*   **`NotificationPref`**: The spec includes this model for managing user notification preferences. The current schema has a `Notification` model for storing notifications, but not a separate model for user preferences.
*   **`AnalyticsSnapshot`**: This model for storing periodic analytics data is missing, which will prevent the implementation of the specified reporting features.

### 2.2. Modified Models

Several models that exist in both the schema and the spec have different structures:

*   **`User`**: The schema has a more complex, normalized structure with separate profile tables (`CustomerProfile`, `MechanicProfile`, `AdminProfile`). While this is a good database design practice, it differs from the simpler `User` model in the spec.
*   **`Quote`**: The schema's `Quote` model is missing key fields from the spec, such as `line_items`, `labor_rate`, `travel_fee`, and `discounts_applied`. This makes it impossible to implement the `quote_calculation` business rule.
*   **`Job`**: The schema's `Job` model is missing `parts_used` and `timers`, which are necessary for detailed job tracking and billing.

### 2.3. Additional Models

The schema includes several models not present in the specification:

*   `MechanicVerification`, `JobTimeline`, `ChatMessage`

While these models represent useful features, they also represent a deviation from the original plan and add complexity to the data model.

## 3. Implications of Discrepancies

The differences between the implemented schema and the specification have several major consequences:

*   **Blocked Business Logic:** The most critical business logic, such as quote calculation and service-based pricing, cannot be implemented with the current schema.
*   **Incorrect Application Flow:** The intended "request -> quote -> job" flow is not supported by the current data models.
*   **Increased Complexity:** The additional, unspecified models add complexity to the codebase and deviate from the project plan.

**Conclusion:**

The database schema needs to be refactored to align with the project specification before the core features of the application can be implemented correctly. The `REFACTOR_PLAN.md` document provides a detailed roadmap for this process.
