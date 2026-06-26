const fs = require('node:fs');
const path = require('node:path');

const migrationsRoot = path.join(__dirname, 'migrations');
const baselineMigration = '20260625170000_baseline';
const destructivePatterns = [
  { label: 'DROP TABLE', pattern: /\bDROP\s+TABLE\b/i },
  { label: 'DROP COLUMN', pattern: /\bDROP\s+COLUMN\b/i },
  { label: 'TRUNCATE', pattern: /\bTRUNCATE\b/i },
  { label: 'DROP TYPE', pattern: /\bDROP\s+TYPE\b/i },
  { label: 'DROP SCHEMA', pattern: /\bDROP\s+SCHEMA\b/i },
];

function inspectMigration(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  if (/release-policy:\s*allow-destructive\s+\S+/i.test(sql)) {
    return [];
  }

  return destructivePatterns
    .filter(({ pattern }) => pattern.test(sql))
    .map(({ label }) => label);
}

function main() {
  const violations = fs
    .readdirSync(migrationsRoot, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        entry.name !== baselineMigration &&
        fs.existsSync(path.join(migrationsRoot, entry.name, 'migration.sql')),
    )
    .flatMap((entry) => {
      const filePath = path.join(migrationsRoot, entry.name, 'migration.sql');
      return inspectMigration(filePath).map((operation) => ({
        migration: entry.name,
        operation,
      }));
    });

  if (violations.length > 0) {
    console.error('Destructive migration operations require explicit review:');
    for (const violation of violations) {
      console.error(`- ${violation.migration}: ${violation.operation}`);
    }
    console.error(
      'Add "-- release-policy: allow-destructive <reason>" only after backup, restore, compatibility, and rollback review.',
    );
    process.exitCode = 1;
    return;
  }

  console.log('Migration policy check passed: no unreviewed destructive SQL.');
}

if (require.main === module) {
  main();
}

module.exports = { inspectMigration };
