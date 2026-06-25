const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');

const baselineMigration = '20260625170000_baseline';
const backendRoot = path.resolve(__dirname, '..');
const schemaPath = path.join(__dirname, 'schema.prisma');
const prismaCliPath = require.resolve('prisma/build/index.js');
const prisma = new PrismaClient();

function runPrisma(args) {
  const result = spawnSync(process.execPath, [prismaCliPath, ...args], {
    cwd: backendRoot,
    env: process.env,
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
}

async function tableExists(tableName) {
  const rows = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = current_schema()
        AND table_name = ${tableName}
    ) AS "exists"
  `;

  return rows[0]?.exists === true;
}

async function assertSchemaMatches() {
  const status = runPrisma([
    'migrate',
    'diff',
    `--from-schema-datasource=${schemaPath}`,
    `--to-schema-datamodel=${schemaPath}`,
    '--exit-code',
  ]);

  if (status === 2) {
    throw new Error(
      'Database schema drift detected. Refusing to baseline or start until the drift is resolved.',
    );
  }
  if (status !== 0) {
    throw new Error(`Prisma schema comparison failed with status ${status}.`);
  }
}

async function main() {
  const hasMigrationHistory = await tableExists('_prisma_migrations');
  const hasApplicationSchema = await tableExists('UserAccount');

  if (!hasMigrationHistory && hasApplicationSchema) {
    await assertSchemaMatches();
    const resolveStatus = runPrisma([
      'migrate',
      'resolve',
      '--applied',
      baselineMigration,
    ]);
    if (resolveStatus !== 0) {
      throw new Error(
        `Could not mark baseline migration as applied (status ${resolveStatus}).`,
      );
    }
  }

  const deployStatus = runPrisma(['migrate', 'deploy']);
  if (deployStatus !== 0) {
    throw new Error(
      `Prisma migrate deploy failed with status ${deployStatus}.`,
    );
  }

  await assertSchemaMatches();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
