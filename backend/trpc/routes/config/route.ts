import { router, publicProcedure, protectedProcedure } from '../../trpc';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { requireRole } from '@/backend/middleware/auth';
import { UserRole } from '@prisma/client';

const defaultConfig: Array<{ key: string; value: string | boolean | number | null }> = [
  { key: 'isProduction', value: false },
  { key: 'enableChatbot', value: true },
  { key: 'enableVINCheck', value: true },
  { key: 'showScooterSupport', value: true },
  { key: 'showMotorcycleSupport', value: true },
];

const normalizeConfigValue = (value: Prisma.JsonValue | null): string | boolean | number | null => {
  if (value === null) {
    return null;
  }
  if (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }
  return null;
};

export const configRouter = router({
  getAll: publicProcedure.query(async () => {
    const storedConfig = await prisma.systemConfig.findMany({
      orderBy: { key: 'asc' },
    });
    const merged = new Map(defaultConfig.map((item) => [item.key, item.value]));

    storedConfig.forEach((entry) => {
      merged.set(entry.key, normalizeConfigValue(entry.value));
    });

    return Array.from(merged.entries()).map(([key, value]) => ({
      key,
      value: value as string | boolean | number | null,
    }));
  }),
  
  set: protectedProcedure
    .use(requireRole(UserRole.ADMIN))
    .input(z.object({
      key: z.string(),
      value: z.union([z.string(), z.boolean(), z.number(), z.null()]),
    }))
    .mutation(async ({ input }) => {
      const config = await prisma.systemConfig.upsert({
        where: { key: input.key },
        create: {
          key: input.key,
          value: input.value as Prisma.InputJsonValue,
        },
        update: {
          value: input.value as Prisma.InputJsonValue,
        },
      });

      return { success: true, config: { key: config.key, value: config.value } };
    }),
});
