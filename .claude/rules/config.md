---
paths:
  - "src/config/**"
  - "src/main.ts"
  - "src/app.module.ts"
  - "src/database/data-source.ts"
  - ".env*"
  - "docker-compose.yml"
  - "Dockerfile"
  - "deploy/**"
---

# Configuration (.env)

| Variable | Purpose |
|---|---|
| `APP_ENV`, `APP_PORT` | `production` disables Swagger and `synchronize` (the Docker image sets `production` itself) |
| `CORS_ORIGINS` | allowed frontend origins, comma-separated (`https://medscheduler.com`); required in production, empty outside it = any origin. No cookies, `credentials` disabled |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | DB (used by both `docker-compose.yml` and the app) |
| `DB_MIGRATIONS_RUN` | `'FALSE'` disables `migrationsRun` on start; in production migrations run in a separate container (`docker run <image> migrate`) |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | token secrets; required with `APP_ENV=production` (the app will not start without them), default strings in dev |
| `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `PASSWORD_RESET_TTL` | duration: seconds or a number with `s` / `m` / `h` / `d` (`15m`, `7d`), see `config/duration.ts`. An invalid value stops startup. Defaults: 900 / 604800 / 86400 |
| `FEATURE_REGISTER` | `'TRUE'` enables `POST /api/auth/register` |
| `INIT_EMAIL`, `INIT_PASSWORD` | admin credentials for `seed:run` |

New variable → `registerAs(...)` in `src/config/`, a row in this table, `.env.example` and the server env template.
