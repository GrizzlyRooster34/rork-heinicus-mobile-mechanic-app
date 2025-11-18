import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Singleton
 *
 * This ensures we only have one instance of PrismaClient throughout the application,
 * which is important for connection pooling and performance.
 *
 * In development, the singleton is attached to the global object to prevent
 * multiple instances from being created during hot reloading.
 */

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Graceful shutdown handler
 * Ensures database connections are properly closed when the server shuts down
 */
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
