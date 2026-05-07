# Terraform Roadmap

Terraform is not active for local development yet. This directory records the
intended production module boundaries so hosted infrastructure can be introduced
without changing application code.

## Planned Modules

- `network`: project networking, domains, TLS, and ingress rules.
- `database`: PostgreSQL instance, backup policy, and connection outputs.
- `cache`: Redis instance for BullMQ.
- `backend`: API and worker service definitions.
- `web`: static/web service deployment.
- `secrets`: references to externally managed secrets, without storing secret values.
- `observability`: log drains, error telemetry, and alert routing.

## Rules

- Never commit generated state files or secrets.
- Keep database migrations owned by Prisma, not Terraform.
- Treat workers as independently scalable from the backend API.
- Require a plan review before any production apply.
