# api-med-scheduler

REST API розкладу занять медичного університету: користувачі, ролі й дозволи, кафедри, студентські групи, семестри, заняття (lessons) та їх серії.
Фронтенд — сусідній репозиторій `../front-med-scheduler`.

Доменна модель, правила доступу до занять і карта ендпоінтів — у [docs/domain.md](docs/domain.md). Читай її перед будь-якою зміною в `modules/lesson`, `modules/users` чи дозволах.

## Правила

Правила й тематичні довідки — у `.claude/rules/`, карта «контекст → файл» — [.claude/rules/index.md](.claude/rules/index.md). Тут вони не повторюються. Завжди діють `git`, `commands`, `operations`; решта підвантажується за шляхами файлів: конвенції коду й API, анатомія модуля, авторизація й нові дозволи, БД і міграції, `.env`, Docker, гілки й CI.

## Стек

NestJS 11 · TypeORM 0.3 · PostgreSQL 16 · Passport JWT (access + refresh) · argon2 · class-validator / class-transformer · Swagger · dayjs.

## Команди

```bash
docker compose up -d            # Postgres (порт і креди з .env: DB_PORT, DB_USER, DB_PASSWORD, DB_NAME)
npm run start:dev               # dev-сервер з watch
npm run build                   # nest build → dist/
npm run lint                    # eslint --fix по всьому репозиторію
npm run lint:check              # eslint без виправлень (для CI)

npm run migration:generate -- src/database/migrations/<kebab-name>   # build + генерація з різниці entity ↔ БД
npm run migration:run           # build + застосувати
npm run migration:revert        # build + відкотити останню
npm run seed:run                # build + створити роль Admin і користувача з INIT_EMAIL / INIT_PASSWORD
```

- Swagger: `http://localhost:<APP_PORT>/api/docs` (лише коли `APP_ENV !== 'production'`).
- Тестів немає: jest-конфіг у `package.json` є, але `*.spec.ts` і скриптів `test` нема (README застарів).
- Усі скрипти TypeORM працюють із **зібраним** `dist/` (`data-source.ts` дивиться в `dist/**/*.entity.js` і `dist/database/migrations/*.js`), тому кожен з них спершу робить `npm run build`.
- Що з цього й коли можна запускати — `.claude/rules/commands.md`.

## Скіли й правила

Процедури — `.claude/skills/`. Переносні (NestJS + TypeORM, без домену): `nest-module-anatomy`, `nest-dto-validation`, `nest-authorization`, `typeorm-migrations`. Доменні: `scheduler-lessons`, `scheduler-accounts`. Наскрізні: `api-contract-change` (синхронізація з фронтом), `api-rebuild-plan` (рішення дня нуль і порядок побудови).
Сабагенти — `.claude/agents/`: `devops-engineer` (інфраструктура, Docker, CI/CD, деплой, Postgres у проді; з кореневої папки доступний через symlink `../.claude/agents/`).
Жорсткі обмеження — `.claude/rules/`, вхід — `index.md`.

## Структура

```
src/
  main.ts                  # CORS, Swagger, глобальні ResponseInterceptor / AllExceptionsFilter / ValidationPipe
  app.module.ts            # ConfigModule (global) + TypeORM (autoLoadEntities, migrationsRun) + модулі
  config/                  # registerAs('app' | 'database' | 'auth' | 'features'), експорт через index.ts
  database/
    data-source.ts         # DataSource для CLI TypeORM (читає .env через dotenv)
    migrations/            # <timestamp>-<kebab-name>.ts
    seeds/                 # SeedAdmin + run-seeds.ts
  shared/
    decorator/             # @Feature(name)
    guards/                # FeatureGuard (вмикається через features.<name>)
    interceptors/          # обгортає відповідь у { status: true, data }
    filters/               # будь-яка помилка → { status: false, message }
    factories/             # @ApiGenericResponses({ [status]: Dto }) для Swagger
    models/                # Permission enum, IPaginationFilters, IGenericListPayloadResponse
  modules/
    auth/  users/  roles/  departments/  student-groups/  semester/  lesson/  dictionaries/  health/
```

## Відомі пастки

- Невалідний UUID у шляху (`/semesters/abc`) дає **500** з текстом помилки Postgres: параметри не проходять `ParseUUIDPipe`.
- `SeedAdmin.down()` видаляє `admin@example.com`, а не `INIT_EMAIL`.
- Сутність `semester` і модуль `lesson` названі в однині, решта — у множині. Шляхи імпорту перевіряй, а не вгадуй.
