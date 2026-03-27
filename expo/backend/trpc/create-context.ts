import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';

export function createContext(opts: FetchCreateContextFnOptions) {
  return {
    req: opts.req,
    environment: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
  };
}

export type Context = ReturnType<typeof createContext>;

// Re-export router and procedures from trpc.ts for convenience
export { router as createTRPCRouter, publicProcedure, protectedProcedure } from './trpc';
export type { JWTPayload, AuthContext } from './middleware/auth';