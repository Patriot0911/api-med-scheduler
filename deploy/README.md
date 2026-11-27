# Деплой на сервер

Один сервер, Docker Compose, по одному інстансу кожного сервісу. Кожен репозиторій має власний compose-проєкт у своїй папці на сервері; деплоять їх незалежні workflow `deploy.yml`.

```
reverse proxy на хості (TLS, домени)
  ├─ сайт      ─► 127.0.0.1:4000 ─► med-web      (front-med-scheduler, /app/med-scheduler/front)
  └─ API       ─► 127.0.0.1:3000 ─► med-api ─► med-postgres   (цей репозиторій, /app/med-scheduler/api)
```

Браузер ходить в API напряму за його доменом (адреса вшита в образ фронту), тож спільна Docker-мережа між api і web не потрібна. Postgres доступний лише всередині проєкту `med-api` і на `127.0.0.1` хоста (бекапи, SSH-тунель).

## Файли

| Файл | Що це | На сервері |
|---|---|---|
| `docker-compose.yml` | `postgres` + одноразовий `migrate` + `api`; `api` стартує лише після успішного `migrate` | `/app/med-scheduler/api/docker-compose.yml` |
| `.env.example` | шаблон єдиного `.env` (БД, JWT, CORS, порти, тег образу) | `/app/med-scheduler/api/.env`, `chmod 600` |
| `docker/daemon.json` | ротація логів Docker, `live-restore` | `/etc/docker/daemon.json` |

Compose фронту — `front-med-scheduler/deploy/docker-compose.yml` → `/app/med-scheduler/front/`.

## Як іде деплой

Push (merge PR) у `production` → `.github/workflows/deploy.yml`:

1. `ci` — той самий `ci.yml` (lint, typecheck, build, міграції на порожній БД); без нього далі не йде.
2. `build · push` — образ у GHCR з тегами `latest` і `sha-<short>`.
3. `deploy to server` — SSH на сервер: `docker compose pull` → `up -d` (спершу `migrate`, потім перестворюється `api`) → чекає `healthy` до 90 с (інакше друкує логи й падає) → `docker image prune -f`.

Якщо `migrate` падає, `up -d` завершується помилкою, а `api` лишається на старому образі. Під час перестворення контейнера API кілька секунд недоступний — це прийнятно.

## Одноразове налаштування

На сервері:

```bash
mkdir -p /app/med-scheduler/api /app/med-scheduler/front
# скопіювати сюди docker-compose.yml (і .env з .env.example) з цього репо; фронт — свій compose у /front
docker login ghcr.io -u <github-user>      # PAT з read:packages, якщо пакети приватні
cd /app/med-scheduler/api && docker compose up -d
docker compose run --rm api seed           # лише на порожній БД; потім прибрати INIT_* з .env
```

У GitHub (обидва репо), environment `production`: secrets `SSH_HOST`, `SSH_USER`, `SSH_KEY`. Фронт додатково — repository variable `NEXT_PUBLIC_API_URL` (`https://<домен API>/api`).

`docker-compose.yml` на сервер workflow не копіює: змінив його в репо — онови вручну.

## Ручні операції

```bash
cd /app/med-scheduler/api
docker compose ps
docker compose logs -f api
docker compose run --rm api migrate:show

# відкат на попередній образ (лише код — схема лишається новою, тому міграції expand / contract)
API_TAG=sha-abc1234 docker compose up -d api
```
