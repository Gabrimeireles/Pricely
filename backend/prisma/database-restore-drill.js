const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const sourceUrl = new URL(process.env.DATABASE_URL);
const sourceDatabase = sourceUrl.pathname.replace(/^\//, '');
const targetDatabase = `${sourceDatabase}_restore_drill`;
const targetUrl = new URL(sourceUrl.toString());
targetUrl.pathname = `/${targetDatabase}`;
const dumpPath = path.join(
  os.tmpdir(),
  `pricely-restore-drill-${process.pid}.dump`,
);

function executable(name) {
  return process.platform === 'win32' ? `${name}.exe` : name;
}

function connectionArgs(database) {
  return [
    '--host',
    sourceUrl.hostname,
    '--port',
    sourceUrl.port || '5432',
    '--username',
    decodeURIComponent(sourceUrl.username),
    '--dbname',
    database,
  ];
}

function run(command, args, options = {}) {
  const result = spawnSync(executable(command), args, {
    env: {
      ...process.env,
      PGPASSWORD: decodeURIComponent(sourceUrl.password),
      ...options.env,
    },
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0 && !options.allowFailure) {
    throw new Error(
      `${command} failed with status ${result.status}: ${result.stderr ?? ''}`,
    );
  }
  return result;
}

function query(databaseUrl, sql) {
  const database = new URL(databaseUrl).pathname.replace(/^\//, '');
  return run(
    'psql',
    [
      ...connectionArgs(database),
      '--tuples-only',
      '--no-align',
      '--command',
      sql,
    ],
    { capture: true },
  ).stdout.trim();
}

function main() {
  if (!sourceDatabase || sourceDatabase.endsWith('_restore_drill')) {
    throw new Error('DATABASE_URL must point to the source database.');
  }

  run('dropdb', [
    ...connectionArgs(targetDatabase).slice(0, -2),
    '--if-exists',
    targetDatabase,
  ]);

  try {
    run('pg_dump', [
      ...connectionArgs(sourceDatabase),
      '--format=custom',
      '--no-owner',
      '--file',
      dumpPath,
    ]);
    run('createdb', [
      ...connectionArgs(targetDatabase).slice(0, -2),
      targetDatabase,
    ]);
    run('pg_restore', [
      ...connectionArgs(targetDatabase),
      '--exit-on-error',
      '--no-owner',
      dumpPath,
    ]);

    const migrate = spawnSync(
      process.execPath,
      [path.join(__dirname, 'migrate-deploy.js')],
      {
        cwd: path.resolve(__dirname, '..'),
        env: {
          ...process.env,
          DATABASE_URL: targetUrl.toString(),
        },
        encoding: 'utf8',
      },
    );
    if (migrate.status !== 0) {
      throw new Error(
        `Restored database migration validation failed: ${migrate.stderr}`,
      );
    }

    const tableQuery =
      "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'";
    const migrationQuery =
      "SELECT coalesce(string_agg(migration_name, ',' ORDER BY started_at), '') FROM _prisma_migrations WHERE finished_at IS NOT NULL";
    const sourceTables = query(sourceUrl.toString(), tableQuery);
    const restoredTables = query(targetUrl.toString(), tableQuery);
    const sourceMigrations = query(sourceUrl.toString(), migrationQuery);
    const restoredMigrations = query(targetUrl.toString(), migrationQuery);

    if (
      sourceTables !== restoredTables ||
      sourceMigrations !== restoredMigrations
    ) {
      throw new Error(
        `Restore verification mismatch: tables ${sourceTables}/${restoredTables}, migrations ${sourceMigrations}/${restoredMigrations}.`,
      );
    }

    console.log(
      `Restore drill passed: ${restoredTables} public tables and matching migration history.`,
    );
  } finally {
    run(
      'dropdb',
      [
        ...connectionArgs(targetDatabase).slice(0, -2),
        '--if-exists',
        targetDatabase,
      ],
      { allowFailure: true },
    );
    fs.rmSync(dumpPath, { force: true });
  }
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
