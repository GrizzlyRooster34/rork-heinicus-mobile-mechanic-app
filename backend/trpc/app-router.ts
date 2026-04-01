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
import { chatRouter } from './routes/chat/route';
import { customerRouter } from './routes/customer/route';
import { photosRouter } from './routes/photos/route';
import { paymentRouter } from './routes/payment/route';
import { reviewsRouter } from './routes/reviews/route';
import { notificationsRouter } from './routes/notifications/route';

export const appRouter = router({
  example: router({
    hi: hiProcedure,
  }),
  diagnosis: diagnosisRouter,
  auth: authRouter,
  admin: adminRouter,
  quote: quoteRouter,
  job: jobRouter,
  config: configRouter,
  vin: vinRouter,
  mechanic: mechanicRouter,
  chat: chatRouter,
  customer: customerRouter,
  photos: photosRouter,
  payment: paymentRouter,
  reviews: reviewsRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
