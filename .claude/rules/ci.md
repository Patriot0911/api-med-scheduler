---
paths:
  - ".github/**"
---

# Branches and CI

- `master` — development; `production` — what is deployed (deploys only from it, via PR `master → production`). No `staging` branch is planned.
- `.github/workflows/ci.yml` runs on PRs to `master` / `production`, on push to `master` and manually; CD will call it via `workflow_call`. Jobs:
  - `quality` — `npm run lint:check`, `tsc --noEmit`, `npm run build`;
  - `database` — Postgres 16 service container: all migrations on an empty DB, revert + re-run of the latest, seed, app start and `GET /api/health/ready` (with `APP_ENV=production`);
  - `docker` — image build without push (`type=gha` cache).
- There is no entity ↔ migration drift check (`migration:generate --check`) in CI: migrations name constraints explicitly while TypeORM generates its own names, so the check always reports name-only differences.
- Dependabot (`.github/dependabot.yml`) — npm, docker, github-actions, PRs to `master`.
