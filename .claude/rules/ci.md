---
paths:
  - ".github/**"
---

# Branches and CI

- `master` — development; `production` — what is deployed (deploys only from it, via PR `master → production`). No `staging` branch is planned.
- `.github/workflows/deploy.yml` runs on push to `production` and manually: `ci.yml` via `workflow_call` → image push to GHCR (`latest`, `sha-<short>`) → SSH to the server, `docker compose pull && up -d`, health wait, `image prune`. Secrets in environment `production`: `SSH_HOST`, `SSH_USER`, `SSH_KEY`. Details — `deploy/README.md`.
- `.github/workflows/ci.yml` runs on PRs to `master` / `production`, on push to `master`, manually and from `deploy.yml`. Jobs:
  - `quality` — `npm run lint:check`, `tsc --noEmit`, `npm run build`;
  - `database` — Postgres 16 service container: all migrations on an empty DB, revert + re-run of the latest, seed, app start and `GET /api/health/ready` (with `APP_ENV=production`);
  - `docker` — image build without push (`type=gha` cache).
- There is no entity ↔ migration drift check (`migration:generate --check`) in CI: migrations name constraints explicitly while TypeORM generates its own names, so the check always reports name-only differences.
- Dependabot (`.github/dependabot.yml`) — npm, docker, github-actions, PRs to `master`.
