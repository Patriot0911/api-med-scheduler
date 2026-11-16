# api-med-scheduler

REST API розкладу занять медичного університету: користувачі, ролі й дозволи, кафедри, студентські групи, семестри, заняття (lessons) та їх серії.
Фронтенд — сусідній репозиторій `../front-med-scheduler`.

Доменна модель, правила доступу до занять і карта ендпоінтів — у [docs/domain.md](docs/domain.md). Читай її перед будь-якою зміною в `modules/lesson`, `modules/users` чи дозволах.

## Git

- **ШІ ніколи не комітить і не пушить** — навіть на прохання (тоді лише текст повідомлення коміту). Зміни лишаються в робочому дереві, коміти робить користувач. Деталі — `.claude/rules/git.md`.

## Стек

NestJS 11 · TypeORM 0.3 · PostgreSQL 16 · Passport JWT (access + refresh) · argon2 · class-validator / class-transformer · Swagger · dayjs.

## Команди

```bash
docker compose up -d            # Postgres (порт і креди з .env: DB_PORT, DB_USER, DB_PASSWORD, DB_NAME)
npm run start:dev               # dev-сервер з watch
npm run build                   # nest build → dist/
npm run lint                    # eslint --fix
npm run format                  # prettier --write

npm run migration:generate -- src/database/migrations/<kebab-name>   # build + генерація з різниці entity ↔ БД
npm run migration:run           # build + застосувати
npm run migration:revert        # build + відкотити останню
npm run seed:run                # build + створити роль Admin і користувача з INIT_EMAIL / INIT_PASSWORD
```

- Swagger: `http://localhost:<APP_PORT>/api/docs` (лише коли `APP_ENV !== 'production'`).
- Тестів немає: jest-конфіг у `package.json` є, але `*.spec.ts` і скриптів `test` нема (README застарів).
- Усі скрипти TypeORM працюють із **зібраним** `dist/` (`data-source.ts` дивиться в `dist/**/*.entity.js` і `dist/database/migrations/*.js`), тому кожен з них спершу робить `npm run build`.
- **Користувач тримає `start:dev` запущеним; `build` і скрипти TypeORM його ламають.** Типи — `npx tsc --noEmit -p tsconfig.json`; `lint` / `format` масово правлять увесь репозиторій. Див. `.claude/rules/commands.md`.

## Скіли й правила

Процедури — `.claude/skills/`. Переносні (NestJS + TypeORM, без домену): `nest-module-anatomy`, `nest-dto-validation`, `nest-authorization`, `typeorm-migrations`. Доменні: `scheduler-lessons`, `scheduler-accounts`. Наскрізні: `api-contract-change` (синхронізація з фронтом), `api-rebuild-plan` (рішення дня нуль і порядок побудови).
Жорсткі обмеження — `.claude/rules/`: `git`, `commands` (завжди), `code-style`, `controllers`, `dto`, `persistence`, `domain` (за шляхами).

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
    auth/  users/  roles/  departments/  student-groups/  semester/  lesson/  dictionaries/
```

### Анатомія модуля

Кожен доменний модуль має однакову розкладку — дотримуйся її для нових модулів:

```
modules/<name>/
  <name>.module.ts
  controllers/<name>.controller.ts
  dto/<action>-<entity>-request.dto.ts     # класи з декораторами class-validator + @ApiProperty
  models/<entity>-<kind>.model.ts          # інтерфейси I...Model, enum-и (*.enum.ts)
  entities/<entity>.entity.ts              # *Entity
  mappers/<name>.mapper.ts                 # @Injectable, entity → модель відповіді
  services/<name>.service.ts
```

Інтерфейси в `models/` ↔ DTO-класи, що їх `implements`; сервіси працюють з інтерфейсами; mapper `entityToItem / ListItem / DictionaryItem`; контролер не повертає entity; довідники — у `DictionariesModule`. Повністю — скіл `nest-module-anatomy`.

## Конвенції API

- **Префікс** `api/` пишеться вручну в `@Controller('api/<resource>')`, глобального префікса немає.
- **Обгортка відповіді.** `ResponseInterceptor` загортає все в `{ status: true, data }`. Помилки: `{ status: false, message }`, де `message` — рядок **або масив рядків** (помилки class-validator). Не загортай відповідь вручну.
- **Списки**: `{ items, meta: { count } }` (`IGenericListPayloadResponse<T>`). Пагінація: query `page` (від 1) і `pageSize` (0–100) з `@Type(() => Number)`; пошук `search` через `ILIKE '%…%'`. Масиви в query приймаються як повторювані ключі; для одиночного значення використовуй `@Transform(toArray)` (див. `get-users-request.dto.ts`).
- **CRUD-повернення** (історично склалось, не уніфікуй без потреби): `POST` → створений item, `PUT` → здебільшого `boolean` (`!!result.affected`), але users / profiles / lessons повертають оновлений item; `DELETE` → видалений item.
- **ValidationPipe** глобальний з `transform: true, whitelist: true`: поля без декораторів class-validator **мовчки відкидаються**. Правила DTO — скіл `nest-dto-validation`.
- **Поточний користувач**: новий код — `@CurrentUser() { sub }: IAccessTokenPayload`; старий код читає `request.user` через `@Req()`. `sub` — це `users.id`, **не** id профілю викладача/студента.

### Авторизація

Стандартний набір декораторів на захищеному ендпоінті:

```ts
@Get()
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, PermissionsGuard)
@Permissions(Permission.READ_USERS, Permission.MANAGE_USERS)
```

Авторизація має два рівні:

1. **Доступ до ендпоінту** — `@Permissions` + `PermissionsGuard`. Пропускає, якщо є **хоча б один** з перелічених дозволів (OR). **`ADMIN` проходить завжди**, тож у списках його не перелічують. `@Permissions(Permission.ADMIN)` пишуть лише для ендпоінтів «тільки для адміна» (семестри).
2. **Дія над конкретним користувачем або роллю** — ієрархія ролей в `AuthorityService` (`modules/roles/services/authority.service.ts`). Будь-яка зміна чужого акаунта, профілів, ролей чи reset-токена проходить через нього. Формула описана в [docs/domain.md](docs/domain.md#ієрархія-ролей). Свої перевірки «чи може A змінити B» поза цим сервісом не пиши.

- Guard читає дозволи з access-токена (агрегуються з ролей при логіні / refresh), тож після зміни ролей вони оновлюються лише після refresh. `AuthorityService` завжди читає ролі з БД.
- Відповіді users і roles містять `canManage`: чи може поточний користувач керувати цим записом. Фронт має покладатися на цей прапорець, а не повторювати формулу.
- `OptionalJwtAccessGuard` — для публічних ендпоінтів (`/lessons/list`): без заголовка `Authorization` пускає анонімно, з простроченим токеном дає 401.
- Заняття мають окрему модель: у домені викладачів (`/lessons*`) права дають участь у занятті та завідування кафедрою, без дозволів (`LessonAccessService`). Адмін-панель (`/admin/lessons*`) — звичайні дозволи `read_lessons` / `manage_lessons`. Деталі — у [docs/domain.md](docs/domain.md#заняття--правила-доступу).
- `@Feature('register') + FeatureGuard` вмикає ендпоінт через env (`FEATURE_REGISTER='TRUE'`).

### Додавання нового дозволу

Чотири місця: enum, міграція з перестворенням `roles_permissions_enum` (не `ADD VALUE`, коміт `0908603`), фронт `permission.ts` і `permissions.config.ts`. Покроково — скіл `scheduler-accounts`.

## База даних і міграції

- **`synchronize: true` поза production** (`app.module.ts`) і `migrationsRun: true`: dev-сервер сам підганяє схему й застосовує міграції. Тому зміна entity без міграції «працює» локально, але ламає production, `migration:generate` по dev-БД може дати порожній diff, а міграції мають бути ідемпотентними.
- Змішані конвенції колонок: нові — snake_case, старі `users` / `roles` / `semesters` — camelCase (у raw SQL у лапках). Останні міграції — ручна серія таймстемпів `17858000000NN`.
- Правила entity й міграцій — `.claude/rules/persistence.md`, процедура — скіл `typeorm-migrations`.

## Стиль коду

`.claude/rules/code-style.md`: одинарні лапки й кома після останнього елемента навіть в однорядкових об'єктах, абсолютні імпорти між модулями, явні `Promise<IModel>`, без `any`, **коментарі лише ситуативно** (нуль за замовчуванням, рясні коментарі в коді — не зразок).

## Конфігурація (.env)

| Змінна | Призначення |
|---|---|
| `APP_ENV`, `APP_PORT` | `production` вимикає Swagger і `synchronize` |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | БД (і для `docker-compose.yml`, і для застосунку) |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | секрети токенів; при `APP_ENV=production` обов'язкові (застосунок не стартує без них), у dev — дефолтні рядки |
| `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `PASSWORD_RESET_TTL` | тривалість: секунди або число з `s` / `m` / `h` / `d` (`15m`, `7d`), див. `config/duration.ts`. Некоректне значення зупиняє старт. Дефолти: 900 / 604800 / 86400 |
| `FEATURE_REGISTER` | `'TRUE'` вмикає `POST /api/auth/register` |
| `INIT_EMAIL`, `INIT_PASSWORD` | креди адміна для `seed:run` |

## Відомі пастки

- Невалідний UUID у шляху (`/semesters/abc`) дає **500** з текстом помилки Postgres: параметри не проходять `ParseUUIDPipe`.
- `SeedAdmin.down()` видаляє `admin@example.com`, а не `INIT_EMAIL`.
- Сутність `semester` і модуль `lesson` названі в однині, решта — у множині. Шляхи імпорту перевіряй, а не вгадуй.
