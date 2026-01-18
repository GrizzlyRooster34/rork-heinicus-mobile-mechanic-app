import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './create-context';
import { createAuthMiddleware } from '../middleware/auth';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure that ensures user is authenticated
export const protectedProcedure = t.procedure.use(createAuthMiddleware());