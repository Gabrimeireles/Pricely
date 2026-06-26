# Production Release Runbook

## Promotion gate

A production candidate can be promoted only when:

1. The phase PR is merged into `homolog`.
2. Homolog CI and deploy are green.
3. `.github/workflows/release-readiness.yml` passes all jobs.
4. The database restore drill reports matching tables and migration history.
5. Chromium, Firefox, and WebKit smoke tests pass.
6. Flutter analyze, tests, and the Android release build pass.
7. The homolog admin search panel has no active SLO alert.

Record the commit SHA, workflow URLs, migration names, backup filename, and
operator in the release issue.

## Promotion

1. Freeze unrelated schema changes.
2. Confirm `INCIDENT_WEBHOOK_URL`, `APP_ENVIRONMENT`, and `APP_RELEASE`.
3. Create and verify a pre-deploy database backup.
4. Deploy the immutable backend and web images for the accepted SHA.
5. Run `npm run db:migrate:policy`.
6. Run `npm run db:migrate:deploy:safe`.
7. Start the application containers.
8. Validate health, login, public offers, admin metrics, receipt placeholders,
   queues, and one persisted search sample.

Do not run seeders or reset the database during production promotion.

## Rollback

Prisma migrations are forward-only. There is no automatic down migration.

### Application-only rollback

Use this when the new schema remains backward compatible:

1. Redeploy the previous immutable image SHA.
2. Keep the migrated database.
3. Run health and authentication smoke tests.
4. Open a corrective migration task before the next promotion.

### Database restore rollback

Use this only for destructive corruption or an incompatible migration:

1. Stop backend workers and web writes.
2. Preserve the failed database separately for investigation.
3. Restore the verified pre-deploy backup into a new database.
4. Point `DATABASE_URL` to the restored database.
5. Deploy the previous application SHA.
6. Run migration drift validation and release smoke.
7. Reopen traffic only after owner approval.

Never restore over the only copy of the failed database.

## Incident ownership

- Backend/on-call owns migration, queue, and API failures.
- Web owner owns route, browser, and accessibility regressions.
- Mobile owner owns Flutter release and store-candidate failures.
- Product owner approves user-visible degradation and rollback.

Incident payloads may contain release, environment, event name, aggregate
latency, sample count, and fallback rate. They must not contain users, tokens,
search terms, receipts, addresses, or billing identifiers.
