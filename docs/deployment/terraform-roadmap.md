# Terraform Roadmap

## Objective

Terraform will describe production infrastructure after the Railway topology and
observability model stabilize. The first version should be a plan-only workflow until
resource ownership is confirmed.

## State

- Remote state backend: undecided.
- Production apply: manual approval only.
- Secrets: referenced by name from the hosting provider or secret manager; values must
  not enter Terraform state when avoidable.

## Module Boundaries

- Network and DNS
- PostgreSQL
- Redis
- Backend API
- Background workers
- Web app
- Observability and alerting

## Delivery Steps

1. Add formatting and validation commands for Terraform files.
2. Create module skeletons with variables and outputs only.
3. Add a CI plan job that runs on pull requests.
4. Add hosted resources after Railway staging behavior is validated.
