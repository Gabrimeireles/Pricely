import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const {
  inspectMigration,
} = require('../../../prisma/migration-policy-check.js');

describe('migration policy', () => {
  const tempDirectories: string[] = [];

  afterEach(() => {
    for (const directory of tempDirectories.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  function migrationFile(sql: string) {
    const directory = mkdtempSync(join(tmpdir(), 'pricely-migration-policy-'));
    tempDirectories.push(directory);
    const filePath = join(directory, 'migration.sql');
    writeFileSync(filePath, sql);
    return filePath;
  }

  it('rejects destructive SQL without an explicit release exception', () => {
    expect(
      inspectMigration(migrationFile('ALTER TABLE "User" DROP COLUMN "name";')),
    ).toEqual(['DROP COLUMN']);
  });

  it('accepts an approved destructive migration marker', () => {
    expect(
      inspectMigration(
        migrationFile(
          '-- release-policy: allow-destructive approved restore plan\nDROP TABLE "Legacy";',
        ),
      ),
    ).toEqual([]);
  });
});
