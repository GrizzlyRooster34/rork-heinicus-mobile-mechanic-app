# Spec Alignment Analysis
**Date:** October 10, 2025
**Source:** ChatGPT-provided comprehensive blueprint

## Current Implementation Status

### ✅ Correctly Implemented

**Stack:**
- ✅ React Native (Expo) with TypeScript
- ✅ Mobile-first UI
- ✅ Tailwind (NativeWind) for styling
- ✅ tRPC for type-safe APIs
- ✅ AsyncStorage for mobile database (transitional)
- ✅ Expo dev environment

**Roles & RBAC:**
- ✅ Three roles: customer, mechanic, admin
- ✅ Role-based navigation (customer/mechanic/admin layouts)
- ✅ Auth system with User type

**Data Models (Partially):**
- ✅ User with role enum
- ✅ Vehicle with VIN, make, model, year
- ✅ ServiceType enum (comprehensive)
- ✅ Quote with pricing breakdown
- ✅ ServiceRequest (Job equivalent)
- ✅ Mechanic profile

### ⚠️ Spec Gaps & Mismatches

**Database Backend:**
- ❌ SPEC: Postgres (Supabase recommended)
- ✅ CURRENT: AsyncStorage (mobile-only, no server)
- 🔧 ACTION: AsyncStorage is fine for mobile prototype, but needs Supabase migration for production

**Missing Data Model Properties:**
- ❌ Vehicle missing: `user_id` (spec) vs `customerId` (current)
- ❌ NotificationPref model not implemented
- ❌ Availability model not implemented
- ❌ AnalyticsSnapshot model not implemented
- ❌ Tool model not implemented
- ❌ PricingProfile model not implemented

**Quote Calculation:**
- ❌ SPEC Formula: `total = max(minimum_charge, base_price + (labor_rate*est_hours)) + travel_fee - discounts`
- ⚠️ CURRENT: Has laborCost, partsCost, travelCost, totalCost (partial match)
- 🔧 ACTION: Verify calculation logic matches spec formula

**Missing Features:**
- ❌ VIN scanner
- ❌ AI diagnostic (optional step)
- ❌ Auto-accept logic for mechanics
- ❌ Timer tracking for jobs
- ❌ Analytics aggregation
- ❌ PDF/CSV export
- ❌ Quiet hours for notifications
- ❌ Tools & Equipment management
- ❌ Service Pricing customization per mechanic

**API Surface:**
- ⚠️ tRPC routes exist but need verification against spec endpoints
- ❌ Missing: `/reports/summary?period=month`
- ❌ Missing: Auto-accept job assignment logic

### 🐛 Current TypeScript Errors (69+)

**Critical App Errors (6):**
1. `app/(customer)/profile.tsx` - Vehicle missing `customerId`, `createdAt`
2. `app/(customer)/request.tsx` - Vehicle missing `customerId`, `createdAt`
3. `components/forms/ServiceRequestForm.tsx` - Invalid `"general"` ServiceType
4. `components/PaymentModal.tsx` - Stripe hook issues
5. `components/LoadingState.tsx` - Style type mismatches
6. `backend/trpc/routes/payments/route.ts` - API version mismatch

**Test Errors (31):**
- VehicleType uppercase usage ("CAR" vs "car")
- Quote mocks missing required properties (travelCost, estimatedDuration, validUntil)
- ServiceType hyphenated usage ("oil-change" vs "oil_change")
- Deprecated cacheTime in React Query

**Component Errors (~30):**
- Button, ErrorBoundary, LoadingState prop mismatches
- PaymentModal hook return type issues

### 📋 Prioritized Action Plan

**Phase 1: Critical TypeScript Fixes (Immediate)**
1. Fix Vehicle creation in app screens (add customerId, createdAt)
2. Remove "general" ServiceType usage
3. Fix test file VehicleType casing
4. Fix Quote test mocks
5. Fix deprecated cacheTime usage

**Phase 2: Spec Alignment (High Priority)**
1. Verify quote calculation formula matches spec
2. Add missing User.address property
3. Implement NotificationPref model
4. Implement Availability model
5. Implement Tool model
6. Implement PricingProfile model

**Phase 3: Missing Features (Medium Priority)**
1. Auto-accept job logic
2. Timer tracking system
3. Analytics aggregation
4. Service pricing per mechanic
5. Tools & Equipment UI

**Phase 4: Advanced Features (Lower Priority)**
1. VIN scanner integration
2. AI diagnostic (Abacus.AI)
3. PDF/CSV export
4. Quiet hours logic
5. Advanced dispatch

### 🎯 Immediate Next Steps

Given that we're in the middle of TypeScript error fixes, let's:

1. **Finish TypeScript error fixes** (69 errors → 0 errors)
2. **Verify current implementation against spec** (data models, business rules)
3. **Identify minimal set of changes** to align with spec
4. **Create incremental migration plan** (AsyncStorage → Supabase)

---

**Notes:**
- Current app is functional mobile prototype
- AsyncStorage is acceptable for Day 1 mobile deployment
- Supabase migration is production requirement, not prototype blocker
- Focus on TypeScript stability first, then spec alignment
