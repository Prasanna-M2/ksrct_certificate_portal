import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import dotenv from 'dotenv';

dotenv.config();

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

function createPrismaClient(): PrismaClient {
  if (tursoUrl && tursoUrl.startsWith('libsql://') && tursoAuthToken) {
    console.log(`🔌 Connecting Prisma to Turso Cloud Database: ${tursoUrl}`);
    const libsql = createClient({
      url: tursoUrl,
      authToken: tursoAuthToken,
    });
    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({ adapter });
  }

  console.log(`📁 Connecting Prisma to local SQLite database`);
  return new PrismaClient();
}

export const prisma = createPrismaClient();
export default prisma;
