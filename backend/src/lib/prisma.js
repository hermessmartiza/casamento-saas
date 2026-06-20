import { PrismaClient } from '@prisma/client';

const DB_URL = process.env.DATABASE_URL || 'postgresql://bolo:bolo_system@localhost:5432/casamento_saas';

const prisma = new PrismaClient({
  datasources: { db: { url: DB_URL } },
});

export default prisma;
