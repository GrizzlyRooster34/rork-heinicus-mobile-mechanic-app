import { router } from './trpc';
import { hiProcedure } from './routes/example/hi/route';
import { authRouter } from './routes/auth/route';
import { adminRouter } from './routes/admin/route';
import { quoteRouter } from './routes/quote/route';
import { jobRouter } from './routes/job/route';
import { configRouter } from './routes/config/route';
import { vinRouter } from './routes/vin/route';
import { diagnosisRouter } from './routes/diagnosis/route';

export const appRouter = router({
  // Example routes
  example: router({
    hi: hiProcedure,
  }),
  
  // Main app routes
  auth: authRouter,
  admin: adminRouter,
  quote: quoteRouter,
  job: jobRouter,
  config: configRouter,
  vin: vinRouter,
  diagnosis: diagnosisRouter,
});

export type AppRouter = typeof appRouter;