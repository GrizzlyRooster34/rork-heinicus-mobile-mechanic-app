import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { UserRole } from '@prisma/client';

export function createContext(opts: FetchCreateContextFnOptions) {
  return {
    req: opts.req,
    environment: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    // Optional auth context (populated by middleware)
    user: undefined as {
      id: string;
      email: string;
      role: UserRole;
    } | undefined,
    token: undefined as string | undefined,
  };
}

export type Context = ReturnType<typeof createContext>;
