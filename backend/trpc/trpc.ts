import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './create-context';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

// Middleware to check if user is authenticated
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  return next({
    ctx: {
      ...ctx,
      // Narrow the user type to non-null
      user: ctx.user,
    },
  });
});

export const router = t.router;
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
// Protected procedure requires valid JWT authentication
export const protectedProcedure = t.procedure.use(isAuthed);