import { router, publicProcedure } from '../../trpc';
import { z } from 'zod';

// Mock config data for development
const mockConfig = [
  { key: 'isProduction', value: false },
  { key: 'enableChatbot', value: true },
  { key: 'enableVINCheck', value: true },
  { key: 'showScooterSupport', value: true },
  { key: 'showMotorcycleSupport', value: true },
];

export const configRouter = router({
  getAll: publicProcedure.query(() => {
    return mockConfig;
  }),
  
  set: publicProcedure
    .input(z.object({
      key: z.string(),
      value: z.union([z.string(), z.boolean(), z.number()]),
    }))
    .mutation(({ input }) => {
      // In a real app, this would update the database
      console.log(`Config updated: ${input.key} = ${input.value}`);
      return { success: true };
    }),
});