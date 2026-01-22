/**
 * Prisma Database Client
 * Singleton instance for database connections
 */

import { PrismaClient as PrismaClientModule } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClientModule({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });
};

// Use globalThis to store the Prisma client instance
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
