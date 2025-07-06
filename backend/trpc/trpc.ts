import { initTRPC } from '@trpc/server';
import type { Context } from './create-context';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
// For now, we'll use publicProcedure for all procedures
// In production, you would implement proper authentication middleware
export const protectedProcedure = t.procedure;