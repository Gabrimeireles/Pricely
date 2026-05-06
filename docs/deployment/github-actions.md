# GitHub Actions Regression Notes

## Branch Targets

CI runs on pull requests and pushes targeting `homolog` and `phase/**`, plus manual
dispatch. Deploy placeholder runs on pushes to `homolog` and manual dispatch.

## Required Checks

- Backend build, lint, and tests.
- Web build, lint, and tests.
- Mobile analyze and tests.
- Workflow security guard for trigger, permission, and dependency-install hygiene.

## Known Runner Notes

- The mobile job uses Flutter stable with cache enabled. Debug APK build is manual
  dispatch only to keep pull request runs lighter.
- Backend and web dependency installs must use `npm ci`.
- Mobile dependency installs must use `flutter pub get`.

## Security Expectations

- Repository workflow permissions stay read-only by default.
- `pull_request_target` is not allowed for this repository.
- Workflows must not request `contents: write` unless a future release task documents
  why it is required.
- Artifact uploads should be added only with explicit retention and no secrets.
