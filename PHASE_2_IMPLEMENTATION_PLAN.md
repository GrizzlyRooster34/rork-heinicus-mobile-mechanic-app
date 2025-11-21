# Phase 2: Core Features Implementation Plan

**Status:** In Progress
**Start Date:** November 12, 2025
**Phase 1 Completion:** ✅ Complete (Database & Authentication)

---

## Overview

Phase 2 focuses on implementing the core business features that enable real-time interaction between customers and mechanics. These features transform the application from a static database system into a dynamic, real-time service platform.

---

## Phase 2 Features

1. **Real-Time Job Tracking** - WebSocket-based live updates
2. **GPS Location Services** - Track mechanic location and navigate to customers
3. **Payment Integration** - Stripe payment processing
4. **Push Notifications** - Real-time alerts for job updates
5. **In-App Messaging** - Direct communication between customers and mechanics
6. **Photo Uploads** - Upload job photos to cloud storage

---

## Feature 1: Real-Time Job Tracking

### Overview
Enable real-time job status updates using WebSocket connections so customers can see mechanic location and job progress live.

### Technical Approach

**Technology Stack:**
- Socket.io (WebSocket library)
- Redis (optional, for scaling)
- React Native WebSocket support

**Implementation Steps:**

1. **Backend WebSocket Server**
   ```bash
   npm install socket.io redis
   ```
   - Create `backend/websocket/server.ts`
   - Integrate Socket.io with Express server
   - Set up authentication for WebSocket connections (JWT)
   - Create rooms for each job (job-{jobId})

2. **Event Types**
   - `job:status-updated` - Job status changed
   - `job:location-updated` - Mechanic location changed
   - `job:eta-updated` - ETA to customer location updated
   - `job:started` - Mechanic started job
   - `job:completed` - Job completed
   - `job:message` - New message in job chat

3. **Frontend WebSocket Client**
   - Create `lib/websocket.ts` client
   - Auto-reconnection logic
   - Event listeners in components
   - Update Zustand stores with real-time data

4. **Database Schema Updates**
   ```prisma
   model Job {
     // ... existing fields
     currentLatitude  Float?
     currentLongitude Float?
     eta              DateTime?
     lastUpdate       DateTime  @default(now()) @updatedAt
   }
   ```

### Files to Create/Modify

**New Files:**
- `backend/websocket/server.ts` - WebSocket server setup
- `backend/websocket/events.ts` - Event handlers
- `backend/websocket/auth.ts` - WebSocket authentication
- `lib/websocket.ts` - Frontend WebSocket client
- `hooks/useJobTracking.ts` - React hook for job tracking
- `stores/job-tracking-store.ts` - Real-time job state

**Modified Files:**
- `backend/server.ts` - Integrate Socket.io
- `prisma/schema.prisma` - Add real-time tracking fields

### Testing
- Unit tests for WebSocket event handlers
- Integration tests for real-time updates
- E2E tests for customer/mechanic interaction

---

## Feature 2: GPS Location Services

### Overview
Implement GPS tracking for mechanics and navigation to customer locations using React Native Location APIs.

### Technical Approach

**Technology Stack:**
- `expo-location` - GPS access
- `react-native-maps` - Map display
- Google Maps API / Mapbox
- Directions API for navigation

**Implementation Steps:**

1. **Install Dependencies**
   ```bash
   npx expo install expo-location react-native-maps
   npm install @googlemaps/google-maps-services-js
   ```

2. **Location Permissions**
   - Update `app.json` with location permissions
   - Request foreground and background location access
   - Handle permission denials gracefully

3. **Backend Location Service**
   - Create `backend/services/location.ts`
   - Calculate distance between mechanic and customer
   - Calculate ETA using Maps API
   - Store location history for completed jobs

4. **Frontend Components**
   - `components/JobMap.tsx` - Display job location on map
   - `components/MechanicLocationTracker.tsx` - Track mechanic location
   - `components/NavigationButton.tsx` - Open navigation app
   - Update job detail screens with maps

5. **Real-Time Location Broadcasting**
   - Mechanic app sends location updates every 10 seconds
   - Broadcast to customers via WebSocket
   - Store in database for analytics

### Files to Create/Modify

**New Files:**
- `backend/services/location.ts` - Location calculation service
- `backend/trpc/routes/location/route.ts` - Location endpoints
- `components/JobMap.tsx` - Map component
- `components/MechanicLocationTracker.tsx` - Location tracking
- `hooks/useLocation.ts` - Location hook
- `utils/map-utils.ts` - Map utilities

**Modified Files:**
- `app.json` - Location permissions
- `prisma/schema.prisma` - Location history model
- `.env.example` - Add GOOGLE_MAPS_API_KEY

### Environment Variables
```bash
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
# OR
MAPBOX_ACCESS_TOKEN="your-mapbox-token"
```

---

## Feature 3: Payment Integration (Stripe)

### Overview
Integrate Stripe for secure payment processing with support for one-time payments and future subscription features.

### Technical Approach

**Technology Stack:**
- Stripe API
- `@stripe/stripe-react-native` - React Native SDK
- `stripe` - Node.js SDK
- Webhooks for payment confirmation

**Implementation Steps:**

1. **Install Dependencies**
   ```bash
   npm install stripe @stripe/stripe-react-native
   npx expo install expo-crypto
   ```

2. **Backend Stripe Service**
   - Create `backend/services/stripe.ts`
   - Payment intent creation
   - Customer creation and management
   - Payment method storage
   - Refund handling
   - Webhook handling

3. **Database Schema Updates**
   ```prisma
   model Payment {
     id              String        @id @default(cuid())
     jobId           String
     job             Job           @relation(fields: [jobId], references: [id])
     customerId      String
     customer        User          @relation(fields: [customerId], references: [id])

     stripePaymentId String        @unique
     amount          Float
     currency        String        @default("usd")
     status          PaymentStatus @default(PENDING)

     createdAt       DateTime      @default(now())
     updatedAt       DateTime      @updatedAt
   }

   enum PaymentStatus {
     PENDING
     PROCESSING
     SUCCEEDED
     FAILED
     REFUNDED
   }
   ```

4. **Frontend Payment Flow**
   - `components/PaymentSheet.tsx` - Stripe payment UI
   - Accept quote → Create payment intent
   - Display payment sheet
   - Handle payment success/failure
   - Update job status after payment

5. **Webhook Endpoint**
   - Create `backend/webhooks/stripe.ts`
   - Verify webhook signatures
   - Handle payment events (succeeded, failed, refunded)
   - Update database on payment confirmation

### Files to Create/Modify

**New Files:**
- `backend/services/stripe.ts` - Stripe service
- `backend/webhooks/stripe.ts` - Webhook handler
- `backend/trpc/routes/payment/route.ts` - Payment endpoints
- `components/PaymentSheet.tsx` - Payment UI
- `hooks/usePayment.ts` - Payment hook
- `stores/payment-store.ts` - Payment state

**Modified Files:**
- `prisma/schema.prisma` - Add Payment model
- `.env.example` - Add Stripe keys

### Environment Variables
```bash
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Testing
- Test mode with Stripe test cards
- Webhook testing with Stripe CLI
- Refund flow testing
- Failed payment handling

---

## Feature 4: Push Notifications

### Overview
Implement push notifications using Expo Push Notifications to alert users about job updates, messages, and quotes.

### Technical Approach

**Technology Stack:**
- Expo Push Notifications
- `expo-notifications` package
- Backend notification service
- Notification scheduling

**Implementation Steps:**

1. **Install Dependencies**
   ```bash
   npx expo install expo-notifications expo-device
   ```

2. **Backend Notification Service**
   - Create `backend/services/notifications.ts`
   - Store Expo push tokens in database
   - Send notifications via Expo API
   - Batch notification sending
   - Notification templates

3. **Database Schema Updates**
   ```prisma
   model PushToken {
     id        String   @id @default(cuid())
     userId    String
     user      User     @relation(fields: [userId], references: [id])
     token     String   @unique
     platform  String   // 'ios' | 'android'
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
   }

   model Notification {
     id        String            @id @default(cuid())
     userId    String
     user      User              @relation(fields: [userId], references: [id])
     title     String
     body      String
     data      Json?
     type      NotificationType
     read      Boolean           @default(false)
     createdAt DateTime          @default(now())
   }

   enum NotificationType {
     JOB_UPDATE
     NEW_MESSAGE
     QUOTE_RECEIVED
     PAYMENT_RECEIVED
     JOB_COMPLETED
   }
   ```

4. **Frontend Notification Handling**
   - Request notification permissions
   - Register push token with backend
   - Handle foreground notifications
   - Handle background notifications
   - Handle notification taps (deep linking)

5. **Notification Triggers**
   - Job status changed
   - New message received
   - Quote accepted/rejected
   - Payment processed
   - Mechanic assigned
   - Mechanic en route

### Files to Create/Modify

**New Files:**
- `backend/services/notifications.ts` - Notification service
- `backend/trpc/routes/notifications/route.ts` - Notification endpoints
- `hooks/useNotifications.ts` - Notification hook
- `utils/notification-handler.ts` - Notification helpers

**Modified Files:**
- `prisma/schema.prisma` - Add PushToken and Notification models
- `app.json` - Notification permissions

---

## Feature 5: In-App Messaging

### Overview
Real-time chat between customers and mechanics using WebSocket for instant communication.

### Technical Approach

**Technology Stack:**
- Socket.io (reuse from job tracking)
- React Native GiftedChat (optional UI library)
- Image/file upload support

**Implementation Steps:**

1. **Database Schema Updates**
   ```prisma
   model Message {
     id        String   @id @default(cuid())
     jobId     String
     job       Job      @relation(fields: [jobId], references: [id])
     senderId  String
     sender    User     @relation(fields: [senderId], references: [id])
     content   String
     type      MessageType @default(TEXT)
     mediaUrl  String?
     read      Boolean  @default(false)
     createdAt DateTime @default(now())
   }

   enum MessageType {
     TEXT
     IMAGE
     FILE
   }
   ```

2. **Backend Message Service**
   - Create `backend/services/messaging.ts`
   - Store messages in database
   - Broadcast via WebSocket
   - Message history pagination
   - Read receipts

3. **Frontend Chat UI**
   ```bash
   npm install react-native-gifted-chat
   ```
   - `components/ChatScreen.tsx` - Chat interface
   - Real-time message updates via WebSocket
   - Image picker for photo messages
   - Message status indicators
   - Typing indicators

4. **WebSocket Events**
   - `message:new` - New message sent
   - `message:read` - Message marked as read
   - `message:typing` - User is typing

### Files to Create/Modify

**New Files:**
- `backend/services/messaging.ts` - Messaging service
- `backend/trpc/routes/messages/route.ts` - Message endpoints
- `backend/websocket/message-events.ts` - Message WebSocket events
- `components/ChatScreen.tsx` - Chat UI
- `hooks/useChat.ts` - Chat hook
- `stores/message-store.ts` - Message state

**Modified Files:**
- `prisma/schema.prisma` - Add Message model
- `backend/websocket/events.ts` - Add message events

---

## Feature 6: Photo Uploads

### Overview
Enable uploading job photos (before/after, parts, diagnostics) using cloud storage.

### Technical Approach

**Technology Stack:**
- AWS S3 / Cloudinary / Firebase Storage
- `expo-image-picker` - Image selection
- `expo-image-manipulator` - Image optimization
- Presigned URLs for secure uploads

**Implementation Steps:**

1. **Install Dependencies**
   ```bash
   npx expo install expo-image-picker expo-image-manipulator
   npm install aws-sdk # or cloudinary
   ```

2. **Backend Storage Service**
   - Create `backend/services/storage.ts`
   - Generate presigned upload URLs
   - Process uploaded images (resize, optimize)
   - Delete old images
   - Image CDN integration

3. **Database Schema Updates**
   ```prisma
   model JobPhoto {
     id          String       @id @default(cuid())
     jobId       String
     job         Job          @relation(fields: [jobId], references: [id])
     uploaderId  String
     uploader    User         @relation(fields: [uploaderId], references: [id])
     url         String
     thumbnailUrl String?
     type        PhotoType    @default(GENERAL)
     description String?
     createdAt   DateTime     @default(now())
   }

   enum PhotoType {
     BEFORE
     AFTER
     DIAGNOSTIC
     PARTS
     GENERAL
   }
   ```

4. **Frontend Image Upload**
   - `components/PhotoUploader.tsx` - Photo upload component
   - Image picker with camera/gallery options
   - Image compression before upload
   - Upload progress indicator
   - Gallery view for job photos

### Files to Create/Modify

**New Files:**
- `backend/services/storage.ts` - Storage service
- `backend/trpc/routes/photos/route.ts` - Photo endpoints
- `components/PhotoUploader.tsx` - Upload component
- `components/PhotoGallery.tsx` - Gallery view
- `hooks/usePhotoUpload.ts` - Upload hook

**Modified Files:**
- `prisma/schema.prisma` - Add JobPhoto model
- `.env.example` - Add storage credentials

### Environment Variables
```bash
# AWS S3
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="heinicus-job-photos"
AWS_REGION="us-east-1"

# OR Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

---

## Implementation Order

### Recommended Sequence:

1. **Real-Time Job Tracking** (Foundation)
   - Sets up WebSocket infrastructure
   - Other features build on this
   - ~3-5 days

2. **GPS Location Services** (High Priority)
   - Core to mechanic workflow
   - Uses WebSocket for real-time updates
   - ~2-3 days

3. **Push Notifications** (Communication)
   - Enhances user engagement
   - Works with all other features
   - ~1-2 days

4. **In-App Messaging** (Communication)
   - Uses WebSocket infrastructure
   - Important for customer service
   - ~2-3 days

5. **Photo Uploads** (Enhancement)
   - Adds visual documentation
   - Enhances messaging
   - ~2-3 days

6. **Payment Integration** (Business Critical)
   - Complex, needs testing
   - Should be implemented after core features work
   - ~3-4 days

**Total Estimated Time:** 13-20 days

---

## Testing Strategy

### Unit Tests
- WebSocket event handlers
- Location calculations
- Payment processing logic
- Notification sending
- Message handling
- Image upload/processing

### Integration Tests
- Real-time job tracking flow
- GPS tracking with WebSocket
- Payment flow with Stripe webhooks
- Push notification delivery
- Chat message delivery
- Photo upload to storage

### E2E Tests
- Complete job lifecycle with real-time updates
- Customer-mechanic communication
- Payment processing end-to-end
- Notification triggering and handling

---

## Infrastructure Requirements

### Development
- PostgreSQL database (existing)
- Redis (optional, for WebSocket scaling)
- AWS S3 bucket or Cloudinary account
- Stripe test account
- Google Maps API key
- Expo account for push notifications

### Production
- Scalable WebSocket server (Socket.io with Redis adapter)
- CDN for image delivery
- Stripe production account
- Production database with backups
- Monitoring and logging (Sentry, DataDog, etc.)

---

## Security Considerations

1. **WebSocket Authentication**
   - JWT token verification on connection
   - Room access control (user can only join their jobs)

2. **Location Privacy**
   - Only share mechanic location during active jobs
   - Clear location data after job completion
   - Customer location stored securely

3. **Payment Security**
   - PCI compliance via Stripe
   - Never store card numbers
   - Use Stripe webhooks for confirmation
   - Implement idempotency for payments

4. **Photo Upload Security**
   - Validate file types (images only)
   - Limit file sizes (max 5MB)
   - Scan for malware (optional)
   - Presigned URLs with expiration

5. **Messaging Security**
   - End-to-end encryption (future enhancement)
   - Content moderation (optional)
   - Block/report functionality

---

## Database Migration Planning

### New Models Required:
- Payment
- PaymentStatus (enum)
- PushToken
- Notification
- NotificationType (enum)
- Message
- MessageType (enum)
- JobPhoto
- PhotoType (enum)

### Schema Changes:
- Job: Add `currentLatitude`, `currentLongitude`, `eta` fields
- User: Add push notification preferences

### Migration Commands:
```bash
# After updating schema.prisma
npx prisma migrate dev --name phase_2_features
npx prisma generate
```

---

## Rollout Plan

### Feature Flags
Implement feature flags to enable/disable features:
- `ENABLE_REALTIME_TRACKING`
- `ENABLE_PAYMENTS`
- `ENABLE_PUSH_NOTIFICATIONS`
- `ENABLE_MESSAGING`
- `ENABLE_PHOTO_UPLOADS`

### Staged Rollout
1. **Week 1:** Real-time tracking + GPS (core features)
2. **Week 2:** Push notifications + Messaging (communication)
3. **Week 3:** Photo uploads + Payment integration (enhancements)
4. **Week 4:** Testing, bug fixes, optimization

---

## Success Metrics

### Technical Metrics
- WebSocket connection uptime > 99.5%
- Message delivery latency < 500ms
- GPS accuracy within 10 meters
- Payment success rate > 98%
- Push notification delivery rate > 95%
- Image upload success rate > 99%

### Business Metrics
- Average time from job request to acceptance < 5 minutes
- Customer satisfaction score > 4.5/5
- Payment completion rate > 90%
- Active job tracking usage > 80%
- Message response time < 2 minutes

---

## Next Steps

1. ✅ Create Phase 2 implementation plan
2. ⏳ Set up WebSocket server infrastructure
3. ⏳ Implement real-time job tracking
4. ⏳ Add GPS location services
5. ⏳ Integrate push notifications
6. ⏳ Build in-app messaging
7. ⏳ Add photo upload functionality
8. ⏳ Integrate Stripe payments

---

**Document Version:** 1.0
**Last Updated:** November 12, 2025
**Status:** Ready for implementation
