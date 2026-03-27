import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../../create-router';
import { createPaymentIntent, getJobPayments } from '../../../services/stripe';

export const paymentRouter = createTRPCRouter({
  createPaymentIntent: publicProcedure
    .input(z.object({
      jobId: z.string(),
      customerId: z.string(),
      amount: z.number().positive(),
    }))
    .mutation(async ({ input }) => createPaymentIntent(input.jobId, input.customerId, input.amount)),

  getJobPayments: publicProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ input }) => ({ success: true, payments: await getJobPayments(input.jobId) })),
});
