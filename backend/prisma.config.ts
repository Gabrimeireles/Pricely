import 'dotenv/config';

import { defineConfig } from 'prisma/config';

const defaultDatabaseUrl =
  'postgresql://postgres:postgres@127.0.0.1:5432/pricely?schema=public';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  engine: 'classic',
  datasource: {
    url: process.env.DATABASE_URL ?? defaultDatabaseUrl,
  },
  seed: 'node prisma/seed.js',
});
