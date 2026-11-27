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
- `deploy/` — server-side files, not part of the image: `docker-compose.yml` (postgres + one-shot `migrate` + `api`, ports on `127.0.0.1` behind the host reverse proxy), `.env.example` (single server `.env`), `docker/daemon.json`. Flow and manual operations — `deploy/README.md`. Single instance per service; no Caddy, no blue / green.
