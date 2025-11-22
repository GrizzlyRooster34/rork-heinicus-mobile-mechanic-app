# Known Issues - Rork Heinicus Mobile Mechanic App

**Last Updated:** November 22, 2025
**Source:** Comprehensive Branch Audit
**Status:** Pre-Production

---

## Critical Blockers 🚨

These issues **MUST** be resolved before production deployment.

### 1. Missing .env File
- **Severity:** CRITICAL
- **Impact:** Backend cannot start
- **Location:** Root directory
- **Description:** Only .env.example exists with placeholder values
- **Required Variables:**
  - `JWT_SECRET` - Currently set to "your-secret-key-change-this"
  - `DATABASE_URL` - Currently set to "postgresql://..."
  - `STRIPE_SECRET_KEY` - Currently set to "sk_test_..."
  - `FIREBASE_SERVICE_ACCOUNT_KEY` - Currently placeholder
  - `CLOUDINARY_API_SECRET` - Currently placeholder
  - And 20+ more variables

**Action Required:**
```bash
# Create production .env from example
cp .env.example .env
# Then edit .env with REAL production credentials
```

**Risk:** App will crash on startup without proper environment configuration.

---

### 2. Hardcoded Demo Credentials
- **Severity:** CRITICAL SECURITY RISK
- **Impact:** Unauthorized access to production system
- **Location:**
  - `.env.example` (lines with demo passwords)
  - `eas.json` (EXPO_PUBLIC_*_PASSWORD variables)
- **Description:** Demo credentials embedded in build configuration

**Exposed Credentials:**
```env
EXPO_PUBLIC_ADMIN_PASSWORD=admin123
EXPO_PUBLIC_MECHANIC_PASSWORD=mech123
EXPO_PUBLIC_CUSTOMER_PASSWORD=cust123
```

**Action Required:**
1. Remove all EXPO_PUBLIC_*_PASSWORD from eas.json
2. Implement proper authentication without hardcoded credentials
3. Add to .gitignore: `.env.local`, `.env.production`

**Risk:** Anyone with access to the APK can extract admin credentials.

---

### 3. 2FA Test Code Bypass
- **Severity:** CRITICAL SECURITY RISK
- **Impact:** Two-factor authentication can be bypassed
- **Location:** `components/TwoFactorGate.tsx` (lines 68-69)
- **Code:**
```typescript
// FIXME: This is test code - remove before production!
if (code === '123456') {
  return true; // Accept any code for testing
}
```

**Action Required:**
1. Remove hardcoded "123456" bypass
2. Implement proper TOTP verification only
3. Add security logging for failed 2FA attempts

**Risk:** Attackers can bypass 2FA by entering "123456" as the code.

---

### 4. Email Service Not Implemented
- **Severity:** CRITICAL FUNCTIONALITY GAP
- **Impact:** Password reset completely broken
- **Location:**
  - `backend/services/password-reset.ts` (lines 122, 131)
  - `backend/trpc/routes/password-reset/route.ts`
- **Description:** Password reset emails are logged to console instead of sent

**Current Code:**
```typescript
// TODO: Implement actual email sending
console.log('Would send email to:', email);
console.log('Reset link:', resetLink);
```

**Action Required:**
1. Set up Nodemailer with production SMTP credentials
2. Create email templates for password reset
3. Implement rate limiting for reset requests
4. Add email verification

**Required Environment Variables:**
```env
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=Heinicus Mobile Mechanic <noreply@yourdomain.com>
```

**Risk:** Users cannot reset passwords. Account lockouts are permanent.

---

### 5. Stripe Webhook Handlers Incomplete
- **Severity:** CRITICAL BUSINESS LOGIC GAP
- **Impact:** Payments not tracked, users not notified
- **Location:** `backend/routes/payment.ts` (lines 197, 203)
- **Description:** Webhook events received but not processed

**Current Code:**
```typescript
case 'payment_intent.succeeded':
  // TODO: Update database with successful payment
  console.log('Payment succeeded:', paymentIntent.id);
  break;

case 'payment_intent.payment_failed':
  // TODO: Notify user and update job status
  console.log('Payment failed:', paymentIntent.id);
  break;
```

**Action Required:**
1. Update Job table on payment success
2. Send push notifications on payment events
3. Handle refunds and disputes
4. Implement payment reconciliation

**Database Operations Needed:**
```typescript
// On payment success
await prisma.job.update({
  where: { stripePaymentIntentId: paymentIntent.id },
  data: {
    status: 'PAID',
    paidAt: new Date(),
    paymentMethod: paymentIntent.payment_method
  }
});

// Send notification
await sendPushNotification(job.customerId, {
  title: 'Payment Successful',
  body: `Your payment of $${amount} has been processed.`
});
```

**Risk:** Customers charged but jobs not updated. No payment confirmation sent.

---

### 6. No SSL/TLS Configuration
- **Severity:** CRITICAL SECURITY RISK
- **Impact:** All API traffic unencrypted
- **Location:** Backend server configuration
- **Description:** HTTP server running without HTTPS

**Action Required:**
1. Obtain SSL certificate (Let's Encrypt, AWS ACM, etc.)
2. Configure Hono server with HTTPS
3. Update app.config.js with HTTPS URLs
4. Implement SSL certificate auto-renewal

**Example Configuration:**
```typescript
import { serve } from '@hono/node-server';
import { readFileSync } from 'fs';

const server = serve({
  fetch: app.fetch,
  port: 3000,
  tls: {
    key: readFileSync('/path/to/privkey.pem'),
    cert: readFileSync('/path/to/fullchain.pem')
  }
});
```

**Risk:** Man-in-the-middle attacks, credential theft, data interception.

---

## High Priority Issues 🔴

These should be fixed within 2 weeks of launch.

### 7. No Error Tracking Service
- **Severity:** HIGH
- **Impact:** Production issues go undetected
- **Description:** No Sentry, LogRocket, or similar monitoring

**Action Required:**
1. Set up Sentry account
2. Install @sentry/react-native
3. Configure error reporting
4. Add performance monitoring

**Installation:**
```bash
npm install @sentry/react-native
npx @sentry/wizard -i reactNative -p ios android
```

**Configuration:**
```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 1.0,
});
```

---

### 8. Rate Limiting Not Configured
- **Severity:** HIGH
- **Impact:** API abuse, DDoS vulnerability
- **Location:** Environment variables exist but not implemented
- **Description:** RATE_LIMIT_* variables defined but middleware not active

**Action Required:**
1. Implement rate limiting middleware
2. Configure per-endpoint limits
3. Add IP-based throttling
4. Set up Redis for distributed rate limiting

**Example Implementation:**
```typescript
import { rateLimiter } from 'hono-rate-limiter';

app.use('/api/*', rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  keyGenerator: (c) => c.req.header('x-forwarded-for') || 'unknown'
}));
```

---

### 9. Limited API Documentation
- **Severity:** MEDIUM-HIGH
- **Impact:** Developer onboarding, integration issues
- **Description:** No OpenAPI/Swagger documentation

**Action Required:**
1. Generate tRPC documentation
2. Create API integration guide
3. Add example requests/responses
4. Set up Postman/Insomnia collections

---

### 10. No Database Backups Configured
- **Severity:** HIGH
- **Impact:** Data loss risk
- **Description:** No automated backup strategy

**Action Required:**
1. Set up automated daily backups
2. Configure point-in-time recovery
3. Test restore procedures
4. Document disaster recovery plan

---

## Medium Priority Issues 🟡

Should be addressed within first month of production.

### 11. Insufficient Input Validation
- **Severity:** MEDIUM
- **Impact:** Data integrity issues
- **Location:** Various tRPC routes
- **Description:** Some endpoints lack comprehensive Zod validation

**Examples:**
- Job description length not limited
- Phone numbers not validated
- Email format checking inconsistent
- File upload size limits missing

**Action Required:**
1. Add comprehensive Zod schemas
2. Validate file uploads (type, size)
3. Sanitize user input
4. Add XSS protection

---

### 12. WebSocket Reconnection Logic
- **Severity:** MEDIUM
- **Impact:** Real-time features unreliable
- **Location:** `lib/websocket-client.ts`
- **Description:** Basic reconnection but could be more robust

**Action Required:**
1. Implement exponential backoff
2. Add connection health checks
3. Handle offline scenarios
4. Add connection status UI

---

### 13. Image Upload Optimization
- **Severity:** MEDIUM
- **Impact:** Large APK size, slow uploads
- **Location:** Job photo uploads
- **Description:** Images not compressed before upload

**Action Required:**
1. Implement client-side image compression
2. Generate thumbnails
3. Use progressive JPEG/WebP
4. Add upload progress indicators

---

### 14. Push Notification Permissions
- **Severity:** MEDIUM
- **Impact:** Users miss important updates
- **Location:** Notification setup
- **Description:** No graceful handling of denied permissions

**Action Required:**
1. Add permission request UI
2. Handle denied permissions
3. Provide alternative notification method
4. Add notification preferences

---

### 15. Location Services Accuracy
- **Severity:** MEDIUM
- **Impact:** Incorrect mechanic distance calculations
- **Location:** Location tracking
- **Description:** Not optimized for battery life

**Action Required:**
1. Implement geofencing
2. Reduce location update frequency
3. Use significant location changes
4. Add battery optimization

---

### 16. Test Coverage Gaps
- **Severity:** MEDIUM
- **Impact:** Bugs in untested code
- **Status:** Test infrastructure exists but not comprehensive

**Current Coverage:**
- Unit tests: Partial
- Integration tests: Minimal
- E2E tests: None

**Action Required:**
1. Run: `npm run test:coverage`
2. Target: 80% coverage
3. Add integration tests for critical flows
4. Set up E2E testing with Detox

---

## Low Priority Issues 🟢

Nice to have, address as time permits.

### 17. Code Documentation
- **Severity:** LOW
- **Impact:** Maintenance difficulty
- **Description:** Many functions lack JSDoc comments

**Action Required:**
1. Add JSDoc comments to public APIs
2. Document complex algorithms
3. Add inline comments for business logic

---

### 18. TypeScript Strict Mode
- **Severity:** LOW
- **Impact:** Type safety
- **Location:** tsconfig.json
- **Description:** Not using strict mode

**Current:**
```json
{
  "strict": false
}
```

**Recommended:**
```json
{
  "strict": true,
  "strictNullChecks": true,
  "noImplicitAny": true
}
```

---

### 19. Bundle Size Optimization
- **Severity:** LOW
- **Impact:** APK size, download time
- **Description:** No tree-shaking analysis

**Action Required:**
1. Run bundle analyzer
2. Remove unused dependencies
3. Implement code splitting
4. Use dynamic imports

---

### 20. Accessibility (a11y)
- **Severity:** LOW
- **Impact:** User inclusivity
- **Description:** Limited screen reader support

**Action Required:**
1. Add accessibility labels
2. Test with TalkBack/VoiceOver
3. Improve color contrast
4. Add keyboard navigation

---

## Architectural Concerns

### 21. No Caching Strategy
- **Impact:** Slow API responses, high database load
- **Description:** No Redis or in-memory caching

**Recommendation:**
1. Cache frequently accessed data
2. Implement cache invalidation
3. Add CDN for static assets

---

### 22. No Load Testing
- **Impact:** Unknown scalability limits
- **Description:** App not tested under load

**Recommendation:**
1. Set up k6 or Artillery load tests
2. Test concurrent user scenarios
3. Identify bottlenecks
4. Plan for horizontal scaling

---

### 23. No Feature Flags
- **Impact:** Risky deployments
- **Description:** Can't disable features without redeployment

**Recommendation:**
1. Implement feature flag system (LaunchDarkly, Unleash)
2. Add gradual rollout capability
3. Enable A/B testing

---

## Issue Priority Matrix

| Priority | Count | Description | Timeline |
|----------|-------|-------------|----------|
| 🚨 Critical | 6 | Must fix before launch | Immediate |
| 🔴 High | 4 | Fix within 2 weeks | Short-term |
| 🟡 Medium | 10 | Fix within 1 month | Medium-term |
| 🟢 Low | 3 | Nice to have | Long-term |
| **TOTAL** | **23** | - | - |

---

## Pre-Launch Checklist

### Critical Path to Production

- [ ] **Issue #1:** Create production .env file with real credentials
- [ ] **Issue #2:** Remove all hardcoded demo credentials
- [ ] **Issue #3:** Remove 2FA test code bypass
- [ ] **Issue #4:** Implement email service (Nodemailer)
- [ ] **Issue #5:** Complete Stripe webhook handlers
- [ ] **Issue #6:** Configure SSL/TLS certificates
- [ ] **Issue #7:** Set up error tracking (Sentry)
- [ ] **Issue #8:** Implement rate limiting
- [ ] **Issue #10:** Configure database backups

### Testing Requirements

- [ ] Test password reset flow end-to-end
- [ ] Test payment flow with real Stripe test cards
- [ ] Test 2FA authentication
- [ ] Test push notifications
- [ ] Test WebSocket reconnection
- [ ] Load test API endpoints (100+ concurrent users)
- [ ] Security audit (OWASP Top 10)
- [ ] Accessibility audit

### Documentation Requirements

- [ ] Complete README.md with setup instructions
- [ ] Create deployment guide
- [ ] Document API endpoints
- [ ] Create user manual
- [ ] Write troubleshooting guide

---

## Risk Assessment

### Production Launch Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| App crashes on startup (no .env) | HIGH | CRITICAL | Create .env before deployment |
| Security breach (hardcoded creds) | MEDIUM | CRITICAL | Remove all demo credentials |
| 2FA bypass exploited | MEDIUM | HIGH | Remove test code |
| Payment tracking failure | HIGH | HIGH | Complete webhook handlers |
| MITM attack (no SSL) | MEDIUM | CRITICAL | Configure HTTPS |
| Undetected errors | HIGH | MEDIUM | Set up Sentry |

---

## Remediation Plan

### Week 1 (Pre-Launch)
1. Address all 6 critical blockers
2. Set up production environment
3. Configure SSL certificates
4. Implement email service
5. Complete Stripe integration

### Week 2 (Post-Launch)
6. Set up error tracking
7. Implement rate limiting
8. Configure database backups
9. Add comprehensive logging

### Month 1 (Stabilization)
10. Address medium priority issues
11. Improve test coverage
12. Optimize performance
13. Enhance monitoring

### Ongoing
14. Address low priority issues
15. Implement feature flags
16. Add load testing
17. Improve documentation

---

## Contact for Issues

**Project Owner:** [Add contact info]
**DevOps Lead:** [Add contact info]
**Security Lead:** [Add contact info]

---

## Appendix: Testing Commands

### Run Full Test Suite
```bash
npm run test:coverage
```

### Test Specific Areas
```bash
# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# Test authentication
npm run test -- auth-store.test.ts

# Test database
npm run test -- mobile-database.test.ts
```

### Load Testing (after setup)
```bash
# Install k6
brew install k6

# Run load test
k6 run loadtest.js
```

---

## Changelog

### 2025-11-22
- Initial issue documentation from comprehensive branch audit
- Identified 23 issues across 4 priority levels
- Created remediation plan
- Established pre-launch checklist

---

**Document Version:** 1.0
**Next Review:** Before production deployment
**Status:** Pre-production audit complete
