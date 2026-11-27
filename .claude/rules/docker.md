---
paths:
  - "Dockerfile"
  - "docker-entrypoint.sh"
  - ".dockerignore"
  - "docker-compose.yml"
  - "deploy/**"
---

# Docker

- `Dockerfile` (multi-stage, `node:22-alpine`, user `node`, tini) builds the image with `APP_ENV=production`. `.dockerignore` is an allowlist, so any new file the build needs must be added there.
- `docker-entrypoint.sh` accepts: `serve` (default), `migrate`, `migrate:revert`, `migrate:show`, `seed`. Migrations in the image run via `node node_modules/typeorm/cli.js` over the compiled `dist/`, no ts-node.
- HEALTHCHECK — `GET /api/health/ready` (`SELECT 1` against the DB); liveness — `GET /api/health`.
- `docker-compose.yml` — dev Postgres only.
- `deploy/` — an earlier production setup (Caddy, blue / green) that the current plan does not use; it is not part of the image. Extend or rework it only after agreeing with the user.
