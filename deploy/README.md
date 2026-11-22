# Деплой на VPS

Один сервер: Caddy (TLS, два домени) + Postgres + API і web, кожен у двох кольорах (blue / green) для перемикання без простою. Кольори сервісів незалежні: деплой фронту не чіпає API, і навпаки.

```
medscheduler.com      ─► caddy ─► web-{blue|green}:3000
api.medscheduler.com  ─► caddy ─► api-{blue|green}:3000 ─► postgres:5432
```

## Файли

| Файл | Що це |
|---|---|
| `compose.infra.yml` | проєкт `med-infra`: `caddy` і `postgres`, мережі `med-edge` (Caddy ↔ застосунки) і `med-backend` (internal, застосунки ↔ БД). Піднімається один раз, деплой його не чіпає |
| `compose.api.yml` | один колір API, проєкт `med-api-<колір>`, контейнер `api-<колір>`. Змінні: `COLOR`, `API_TAG`, `API_IMAGE` (за замовчуванням GHCR) |
| `compose.web.yml` | один колір web, проєкт `med-web-<колір>`, контейнер `web-<колір>`. Змінні: `COLOR`, `WEB_TAG`, `WEB_IMAGE` |
| `caddy/Caddyfile` | два сайти з `WEB_ADDRESS` / `API_ADDRESS`; `/api/docs` закритий |
| `caddy/active/{api,web}.caddy` | snippet-и `(api_upstream)` / `(web_upstream)` — живий колір кожного сервісу. Перемикання = переписати файл і `caddy reload` |
| `env/*.env.example` | шаблони `caddy.env`, `postgres.env`, `api.env`; справжні `env/*.env` — лише на сервері (chmod 600, у git не потрапляють) |
| `docker/daemon.json` | `/etc/docker/daemon.json`: ротація логів, `live-restore` |

Образ web збирається під домен API: `--build-arg NEXT_PUBLIC_API_URL=https://api.medscheduler.com/api`. API обов'язково з `CORS_ORIGINS=https://medscheduler.com`.

## Ручні операції

Усе — з папки, де лежать ці файли на сервері.

```bash
# інфраструктура (один раз)
docker compose -f compose.infra.yml up -d

# міграції — окремим контейнером з НОВОГО образу, до перемикання трафіку
COLOR=green API_TAG=sha-abc1234 docker compose -f compose.api.yml run --rm api migrate
# seed (лише на порожній БД, потребує INIT_EMAIL / INIT_PASSWORD в env/api.env)
COLOR=green API_TAG=sha-abc1234 docker compose -f compose.api.yml run --rm api seed

# запустити колір і дочекатися healthy
COLOR=green API_TAG=sha-abc1234 docker compose -f compose.api.yml up -d
docker inspect -f '{{.State.Health.Status}}' api-green

# перемкнути трафік (атомарно: тимчасовий файл + mv), перевірити й перезавантажити Caddy
sed 's/api-blue/api-green/' caddy/active/api.caddy > caddy/active/api.caddy.tmp && mv caddy/active/api.caddy.tmp caddy/active/api.caddy
docker exec caddy caddy validate --config /etc/caddy/Caddyfile
docker exec caddy caddy reload --config /etc/caddy/Caddyfile

# старий колір зупинити, але не видаляти — це ціль відкату
COLOR=blue API_TAG=<попередній тег> docker compose -f compose.api.yml stop
```

Відкат — те саме у зворотний бік: `start` зупиненого кольору → healthy → переписати snippet → `reload`. Відкочується лише код: міграції мають бути зворотно сумісними (expand / contract), бо старий колір працює з новою схемою.

Ці кроки автоматизує `deploy.sh` (буде додано разом із CD).

## Локальна перевірка стеку

Без справжніх доменів: адреси з `http://` (Caddy не просить сертифікат), `*.localhost` резолвиться в 127.0.0.1.

```bash
# env/caddy.env: WEB_ADDRESS=http://web.localhost  API_ADDRESS=http://api.localhost
# env/api.env:   CORS_ORIGINS=http://web.localhost:8080
docker build -t local/api:t1 ..
docker build --build-arg NEXT_PUBLIC_API_URL=http://api.localhost:8080/api -t local/web:t1 ../../front-med-scheduler
export HTTP_PORT=8080 HTTPS_PORT=8443 API_IMAGE=local/api WEB_IMAGE=local/web
# далі — ті самі команди з COLOR=blue API_TAG=t1 / WEB_TAG=t1; сайт — http://web.localhost:8080
```

Прибрати: `down` для кожного кольору, потім `docker compose -f compose.infra.yml down -v` (`-v` видаляє БД і сертифікати).
