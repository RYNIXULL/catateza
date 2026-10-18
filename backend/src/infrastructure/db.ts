import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function initializePrisma(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoToken && tursoToken.trim() !== '') {
    console.log(`[Database] Terhubung ke Turso Cloud: ${tursoUrl.replace(/:\/\/.*@/, '://***@')}`);
    const adapter = new PrismaLibSql({
      url: tursoUrl,
      authToken: tursoToken,
    });
    return new PrismaClient({ adapter, log: ['warn', 'error'] });
  }

  // Fallback to local SQLite file
  return new PrismaClient({ log: ['warn', 'error'] });
}

export const prisma = globalForPrisma.prisma || initializePrisma();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
