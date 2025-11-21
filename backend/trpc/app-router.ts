import { router } from './trpc';
import { hiProcedure } from './routes/example/hi/route';
import { diagnosisRouter } from './routes/diagnosis/route';
import { authRouter } from './routes/auth/route';
import { adminRouter } from './routes/admin/route';
import { quoteRouter } from './routes/quote/route';
import { jobRouter } from './routes/job/route';
import { configRouter } from './routes/config/route';
import { vinRouter } from './routes/vin/route';
import { mechanicRouter } from './routes/mechanic/route';
// Phase 2 features from claude/loo
import { twoFactorRouter } from './routes/two-factor/route';
import { passwordResetRouter } from './routes/password-reset/route';
import { locationRouter } from './routes/location/route';
import { notificationsRouter } from './routes/notifications/route';
import { messagesRouter } from './routes/messages/route';
import { photosRouter } from './routes/photos/route';
import { paymentRouter } from './routes/payment/route';
// Additional features from path-2-sdk54
import { paymentsRouter } from './routes/payments/route';
import { reviewsRouter } from './routes/reviews/route';
import { analyticsRouter } from './routes/analytics/route';

export const appRouter = router({
  example: router({
    hi: hiProcedure,
  }),

  // Core routes
  auth: authRouter,
  admin: adminRouter,
  quote: quoteRouter,
  job: jobRouter,
  config: configRouter,
  vin: vinRouter,
  diagnosis: diagnosisRouter,
  mechanic: mechanicRouter,

  // Phase 2 features
  twoFactor: twoFactorRouter,
  passwordReset: passwordResetRouter,
  location: locationRouter,
  notifications: notificationsRouter,
  messages: messagesRouter,
  photos: photosRouter,
  payment: paymentRouter,

  // Additional features
  payments: paymentsRouter,
  reviews: reviewsRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
