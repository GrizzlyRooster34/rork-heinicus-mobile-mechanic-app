import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './create-context';
import { isAuthed } from './middleware/auth';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;

/**
 * Public procedure - accessible without authentication
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires valid JWT authentication
 * Context includes user object with decoded JWT payload
 */
export const protectedProcedure = t.procedure.use(isAuthed);