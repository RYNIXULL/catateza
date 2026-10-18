import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.transaction.findMany().then(console.log).finally(() => prisma.$disconnect());
