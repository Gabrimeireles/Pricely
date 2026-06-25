# Database Backup and Restore

## Automated pre-deploy backup

The homolog deploy creates a custom-format PostgreSQL dump before migrations or
resets:

```text
backups/pre-deploy-<image-tag>-<utc-timestamp>.dump
```

The file is mode `0600`, validated with `pg_restore --list`, and retained on the
server for 14 days. The backup directory is mode `0700`.

## Manual backup

Run inside the deploy directory:

```bash
mkdir -p backups
chmod 700 backups
docker compose --env-file .env exec -T postgres sh -lc \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner' \
  > "backups/manual-$(date -u +%Y%m%dT%H%M%SZ).dump"
chmod 600 backups/manual-*.dump
```

Verify before relying on the file:

```bash
docker compose --env-file .env exec -T postgres sh -lc \
  'pg_restore --list' < backups/manual-<timestamp>.dump >/dev/null
```

## Restore drill

`npm run db:restore:drill`:

1. Dumps `DATABASE_URL`.
2. Creates `<database>_restore_drill`.
3. Restores the custom dump.
4. Runs safe migration and drift validation.
5. Compares public-table and migration-history counts.
6. Drops the temporary database and deletes the dump.

The CI backend job and manual release workflow run this drill against isolated
PostgreSQL 17.

## Production restore

Restore into a new database name:

```bash
createdb <new_database>
pg_restore --exit-on-error --no-owner \
  --dbname <new_database> backups/pre-deploy-<release>.dump
```

Then run:

```bash
DATABASE_URL=<restored-url> npm run db:migrate:deploy:safe
```

Compare migration history, critical row counts, and application health before
changing production `DATABASE_URL`.

## Migration policy

`npm run db:migrate:policy` rejects unreviewed `DROP TABLE`, `DROP COLUMN`,
`TRUNCATE`, `DROP TYPE`, and `DROP SCHEMA` operations.

An exception requires this migration comment:

```sql
-- release-policy: allow-destructive <approved reason>
```

The exception is valid only after backup, restore, compatibility, and rollback
review are recorded in the release issue.
