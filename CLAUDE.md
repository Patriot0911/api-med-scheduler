# api-med-scheduler

REST API розкладу занять медичного університету: користувачі, ролі й дозволи, кафедри, студентські групи, семестри, заняття (lessons) та їх серії.
Фронтенд — сусідній репозиторій `../front-med-scheduler`.

Доменна модель, правила доступу до занять і карта ендпоінтів — у [docs/domain.md](docs/domain.md). Читай її перед будь-якою зміною в `modules/lesson`, `modules/users` чи дозволах.

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

- **Models ↔ DTO.** Для кожного вхідного/вихідного контракту є інтерфейс у `models/` (`ICreateRoleModel`, `IRoleItemModel`). DTO-клас реалізує цей інтерфейс (`class EditRoleRequestDto implements IEditRoleModel`). Сервіси приймають і повертають **інтерфейси**, а не DTO чи entity.
- **Create DTO наслідує Edit DTO**, якщо поля збігаються: `class CreateRoleRequestDto extends EditRoleRequestDto implements ICreateRoleModel {}`.
- **Моделі відповідей**: `I<Entity>ItemModel` (одна сутність), `I<Entity>ListItemModel` (рядок списку, часто `extends ItemModel`), `I<Entity>DictionaryItem(Model)` (`{ id, name }` для селектів).
- **Mapper** має методи `entityToItem`, `entityToListItem`, `entityToDictionaryItem`. Контролер ніколи не повертає entity напряму.
- **Сервіс** інжектить репозиторії через `@InjectRepository(XEntity)`. Чужі entity, з якими працює сервіс, реєструються в `TypeOrmModule.forFeature([...])` його модуля (так зроблено скрізь, а не через імпорт сервісу іншого модуля).
- **Dictionaries**: кожен сервіс, у якого є довідник, має `get<Entity>Dictionary()`. Ендпоінти довідників зібрані в `DictionariesModule` (`/api/dictionaries/*`), а не в модулі сутності.

## Конвенції API

- **Префікс** `api/` пишеться вручну в `@Controller('api/<resource>')`, глобального префікса немає.
- **Обгортка відповіді.** `ResponseInterceptor` загортає все в `{ status: true, data }`. Помилки: `{ status: false, message }`, де `message` — рядок **або масив рядків** (помилки class-validator). Не загортай відповідь вручну.
- **Списки**: `{ items, meta: { count } }` (`IGenericListPayloadResponse<T>`). Пагінація: query `page` (від 1) і `pageSize` (0–100) з `@Type(() => Number)`; пошук `search` через `ILIKE '%…%'`. Масиви в query приймаються як повторювані ключі; для одиночного значення використовуй `@Transform(toArray)` (див. `get-users-request.dto.ts`).
- **CRUD-повернення** (історично склалось, не уніфікуй без потреби): `POST` → створений item, `PUT` → здебільшого `boolean` (`!!result.affected`), але users / profiles / lessons повертають оновлений item; `DELETE` → видалений item.
- **ValidationPipe** глобальний з `transform: true, whitelist: true`: поля без декораторів class-validator **мовчки відкидаються**. Кожне поле DTO потребує хоча б одного декоратора (`@IsOptional()` теж рахується). Дати — `@Type(() => Date) @IsDate()`, вкладені об'єкти — `@ValidateNested() @Type(() => Dto)`.
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
- Тонші правила (власник заняття, кафедра) перевіряються в сервісах, а не guard-ами — див. `LessonAccessService`.
- `@Feature('register') + FeatureGuard` вмикає ендпоінт через env (`FEATURE_REGISTER='TRUE'`).

### Додавання нового дозволу

Postgres-enum `roles_permissions_enum` не оновлюється сам. Потрібно змінити **чотири** місця:

1. `src/shared/models/permission.enum.ts`
2. Міграцію, що перестворює тип (патерн rename → create → `ALTER COLUMN ... USING` → drop old, див. `1785800000005-simplify-lesson-access.ts`). Не використовуй `ALTER TYPE ... ADD VALUE`: нове значення не можна використати в тій самій транзакції, а видалити значення з enum так узагалі неможливо. У проєкті прийнятий саме патерн із перестворенням типу (коміт `0908603`).
3. Фронт: `front-med-scheduler/src/interfaces/auth/permission.ts`
4. Фронт: підпис у `front-med-scheduler/src/configs/permissions.config.ts`

## База даних і міграції

- Таблиці: `snake_case` у множині (`users`, `student_groups`, `teacher_lesson`, `lessons_group` — є винятки). Колонки нових сутностей — `snake_case` через `@Column({ name: 'department_id' })` з camelCase-властивістю. Старі таблиці (`users`, `roles`, `semesters`) мають camelCase-колонки (`"fullName"`, `"rolePriority"`), тож у raw SQL їх треба брати в лапки.
- PK скрізь `@PrimaryGeneratedColumn('uuid')`. FK зберігається і як relation, і як окрема колонка (`department` + `departmentId`).
- Час — `timestamptz`; довгий текст — `type: 'text'`.
- Іменування міграцій: `<timestamp>-<kebab-name>.ts`, клас `<PascalName><timestamp>`, `name = '<PascalName><timestamp>'`. Останні міграції мають «ручні» таймстемпи `17858000000NN` — нова міграція має бути **більшою** за останню.
- Ручні міграції пишуться raw SQL через `queryRunner.query`, з явними іменами обмежень (`FK_<table>_<column>`, `UQ_...`, `IDX_...`), коментарем-поясненням угорі, міграцією даних для наявних рядків і повноцінним `down()`.
- **`synchronize: true` поза production** (`app.module.ts`) і `migrationsRun: true`. Наслідки:
  - dev-сервер сам підганяє схему під entity, тому `migration:generate` по такій БД може дати порожній diff — генеруй по БД, де застосовані лише міграції;
  - зміна entity без міграції «працює» локально, але зламає production. Кожна зміна entity потребує міграції.

## Стиль коду

- Prettier: `singleQuote`, `trailingComma: all`. Старі файли мають подвійні лапки — у нових файлах використовуй одинарні, масово не переформатовуй.
- Характерна звичка: кома після останнього елемента навіть в однорядкових об'єктах: `{ where: { id, }, }`.
- Імпорти між модулями — абсолютні від `src/` (`'src/modules/auth/guards/permission.guard'`), всередині модуля — відносні.
- Методи сервісів `async` і повертають явний тип `Promise<IModel>`. `findOneOrFail` — для «має існувати», `findOne` + власний виняток — коли потрібне конкретне повідомлення.
- Винятки Nest (`BadRequestException`, `ForbiddenException`, `NotFoundException`) з англійським повідомленням для кінцевого користувача.
- Коментарі — мінімально, лише там, де без них складну логіку або неочевидне бізнес-правило не зрозуміти (`/** A head who leaves the department stops being its head */`). Не коментуй те, що вже зрозуміло з назв функцій і змінних. Наявні в коді рясні коментарі — не зразок для нового коду.
- `any` дозволено eslint, але в нових сервісах його немає — не додавай.

## Конфігурація (.env)

| Змінна | Призначення |
|---|---|
| `APP_ENV`, `APP_PORT` | `production` вимикає Swagger і `synchronize` |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | БД (і для `docker-compose.yml`, і для застосунку). `POSTGRES_*` з `.env.example` не використовуються |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | секрети токенів (у `.env.example` помилково `JWT_SECRET`) |
| `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL` | TTL **у секундах** (`Number(...)`); `'15m'` дає `NaN` і тихий fallback 900 / 604800 |
| `PASSWORD_RESET_TTL` | TTL токена скидання пароля, секунди (86400) |
| `FEATURE_REGISTER` | `'TRUE'` вмикає `POST /api/auth/register` |
| `INIT_EMAIL`, `INIT_PASSWORD` | креди адміна для `seed:run` |

## Відомі пастки

- `findOneOrFail` кидає `EntityNotFoundError`, а не `HttpException` → `AllExceptionsFilter` повертає **500**, а не 404. Якщо клієнту потрібен 404, кидай `NotFoundException` сам.
- `SeedAdmin.down()` видаляє `admin@example.com`, а не `INIT_EMAIL`.
- Сутність `semester` і модуль `lesson` названі в однині, решта — у множині. Шляхи імпорту перевіряй, а не вгадуй.
