import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

// SSL configuration required for Supabase Free Tier and Vercel serverless deployment
const isSupabase = connectionString?.includes('supabase') || connectionString?.includes('pooler');
const pool = new Pool({
  connectionString,
  ssl: isSupabase || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});
const adapter = new PrismaPg(pool);

let prisma: PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({ adapter });
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({ adapter });
  }
  prisma = global.prisma;
}

export { prisma };
export default prisma;
