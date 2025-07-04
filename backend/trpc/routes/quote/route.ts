import { z } from 'zod';
import { publicProcedure, createTRPCRouter } from '../../create-context';

export const quoteRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({
      serviceRequestId: z.string(),
      description: z.string(),
      laborCost: z.number(),
      partsCost: z.number(),
      totalCost: z.number(),
      estimatedDuration: z.number(),
      validUntil: z.date(),
    }))
    .mutation(async ({ input }) => {
      // In a real app, this would save to database
      console.log('Creating quote:', input);
      
      const quote = {
        id: `quote-${Date.now()}`,
        ...input,
        status: 'pending' as const,
        createdAt: new Date(),
        createdBy: 'admin-cody', // In real app, get from auth context
      };
      
      return {
        success: true,
        quote
      };
    }),

  listAll: publicProcedure
    .query(async () => {
      // In a real app, this would fetch from database with auth check
      console.log('Getting all quotes');
      
      // Mock quotes data
      return {
        quotes: [
          {
            id: 'quote-1',
            serviceRequestId: 'request-1',
            description: 'Oil change service',
            laborCost: 50,
            partsCost: 30,
            totalCost: 80,
            estimatedDuration: 1,
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'pending' as const,
            createdAt: new Date(),
            createdBy: 'admin-cody',
          }
        ]
      };
    }),

  listMine: publicProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .query(async ({ input }) => {
      // In a real app, this would fetch user's quotes from database
      console.log('Getting quotes for user:', input.userId);
      
      return {
        quotes: []
      };
    }),

  updateStatus: publicProcedure
    .input(z.object({
      quoteId: z.string(),
      status: z.enum(['pending', 'approved', 'declined', 'accepted', 'paid']),
    }))
    .mutation(async ({ input }) => {
      // In a real app, this would update database
      console.log('Updating quote status:', input);
      
      return {
        success: true,
        message: `Quote status updated to ${input.status}`
      };
    }),

  approve: publicProcedure
    .input(z.object({
      quoteId: z.string(),
    }))
    .mutation(async ({ input }) => {
      // In a real app, this would update database and create job
      console.log('Approving quote:', input.quoteId);
      
      return {
        success: true,
        message: 'Quote approved and job scheduled'
      };
    }),
});

// Export with expected name for backward compatibility
export const quoteProcedures = quoteRouter;