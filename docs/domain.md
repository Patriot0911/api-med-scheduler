# Доменна модель і бізнес-правила

Контекст: розклад занять медичного університету. Адміністратор веде довідники (кафедри, групи, семестри, ролі) і користувачів. Викладачі створюють заняття й серії занять. Студенти та викладачі дивляться свій розклад, а публічні заняття видно анонімно в публічному календарі (`/schedule` на фронті).

## Сутності

```
User ──< user_roles >── Role (permissions: Permission[], rolePriority)
 │
 ├── 0..1 Teacher ──> 0..1 Department ── 0..1 headTeacher (Teacher цієї ж кафедри)
 └── 0..1 Student ──> 0..1 StudentGroup ──< student_group_tags >── GroupTag

Lesson ──> LessonsGroup (обов'язково)       LessonsGroup ──> createdByTeacher?, department?
   │──> Semester?   │──> Department?
   ├──< teacher_lesson (teacherId, isOwner, canEdit) >── Teacher
   └──< student_group_lesson >── StudentGroup

PasswordResetToken ──> User
```

| Сутність | Таблиця | Суть |
|---|---|---|
| `UserEntity` | `users` | Обліковий запис. `email` — логін. `refreshToken` зберігається як argon2-хеш. `lastLoginAt` оновлюється при логіні |
| `RoleEntity` | `roles` | Набір дозволів + `rolePriority` (0–256, Admin = 100) |
| `TeacherEntity` | `teachers` | Профіль викладача (1:1 до user). `departmentId` — кафедра або null |
| `StudentEntity` | `students` | Профіль студента (1:1 до user). `studentGroupId`, `isGroupMonitor` (староста) |
| `DepartmentEntity` | `departments` | Кафедра. Унікальна назва. `headTeacherId` — завідувач, має бути викладачем цієї кафедри |
| `StudentGroupEntity` | `student_groups` | Академічна група (`name`, `studyYear`) з тегами |
| `GroupTagEntity` | `group_tags` | Мітка групи (форма навчання, спеціальність тощо) |
| `SemesterEntity` | `semesters` | Навчальний період `dateFrom`–`dateTo` |
| `LessonsGroupEntity` | `lessons_group` | Курс / серія занять («Анатомія, лекція»). Має творця-викладача і, за бажанням, кафедру |
| `LessonEntity` | `lessons` | Одне заняття: `date`, `duration` (хв, ≥5), `delayedDate` (перенесено на), `note`, `visibility`, `departmentId?`, `semesterId?` |
| `TeacherLessonEntity` | `teacher_lesson` | Викладачі заняття. Рівно один `isOwner` (частковий унікальний індекс `UQ_teacher_lesson_owner`), `canEdit` для співвикладачів |
| `StudentGroupLessonEntity` | `student_group_lesson` | Групи, для яких проводиться заняття |
| `PasswordResetTokenEntity` | `password_reset_tokens` | Токен скидання пароля у форматі selector/validator |

**Ідентичність.** Один user може мати одночасно профіль викладача і профіль студента, або жодного. Усі `teacherIds` у заняттях і довіднику `/dictionaries/teachers` — це `teachers.id`, **не** `users.id`.

## Дозволи (`Permission`)

| Дозвіл | Що дає |
|---|---|
| `admin` | Усе (але в `@Permissions` його треба перелічувати явно). Може видавати будь-які дозволи. Бачить і керує всіма заняттями |
| `read_users` / `manage_users` | Список користувачів / створення, редагування, профілі, токени скидання пароля |
| `read_roles` / `manage_roles` | Довідник ролей і дозволів / CRUD ролей (`GET /roles` вимагає `manage_roles`) |
| `read_groups` / `manage_groups` | Студентські групи та теги |
| `read_departments` / `manage_departments` | Кафедри, завідувач, склад кафедри |
| `manage_lessons` | Те саме, що admin, для занять (scope `ALL`) |
| `manage_own_lessons` | Створювати заняття на своє ім'я (потрібен ще й профіль викладача) |
| `read_lessons`, `read_comments`, `manage_comments` | Оголошені, але в коді поки не перевіряються |

Семестри (CRUD) доступні лише `admin`.

**Правило делегування.** Створити / змінити роль або видати / забрати роль користувачу можна, лише якщо в тебе самого є всі її дозволи, або ти `admin`. Редагувати / видаляти роль можна, лише якщо в тебе є роль з вищим `rolePriority` (`RolesService`, `UsersService.checkRolesManageAccess`).

## Автентифікація

- `POST /auth/login` → `{ tokens: { accessToken, refreshToken }, user }`. Access-токен містить `{ use: 'access', sub, permissions, roles }`, refresh — `{ use: 'refresh', sub }`. Секрети різні.
- `POST /auth/refresh` з `Authorization: Bearer <refreshToken>`: токен звіряється з хешем у `users.refreshToken`, видається нова пара (ротація). Один активний refresh на користувача: новий логін розлогінює інші сесії.
- `POST /auth/logout` обнуляє `refreshToken`.
- `PUT /auth/me` — зміна email вимагає `currentPassword` (email — це логін). `PUT /auth/me/password` завжди вимагає поточний пароль.
- Скидання пароля без пошти: адмін викликає `POST /users/:id/password-reset-token` і отримує `selector.validator` + `expiresAt`, передає користувачу, той викликає `POST /auth/reset-password`. Попередні невикористані токени видаляються; validator зберігається як argon2-хеш; успішне скидання обнуляє refresh-токен.
- Адмін може створити користувача без пароля: генерується випадковий, і користувач задає свій через токен скидання.

## Кафедри

- `PUT /departments/:id/teachers` — **повний** склад: викладачі з інших кафедр переводяться сюди, відсутні в списку відв'язуються. Усе в транзакції. Завідувач, що пішов з кафедри, перестає бути завідувачем (і на старій кафедрі теж).
- `PUT /departments/:id/head` — `teacherId` має належати цій кафедрі; `null` знімає завідувача.
- Зміна `departmentId` профілю викладача (`PUT /users/:id/teacher`) теж знімає з нього завідування старою кафедрою.
- Видалення кафедри: у викладачів, занять і груп занять `department_id` стає NULL (`ON DELETE SET NULL`).
- Завідувач кафедри **не** має особливих прав на заняття кафедри (прибрано в міграції `simplify-lesson-access`).

## Заняття — правила доступу

Уся логіка зосереджена в `modules/lesson/services/lesson-access.service.ts`. Не дублюй перевірки в контролерах.

### Видимість (`LessonVisibility`) — хто бачить

| Значення | Хто бачить |
|---|---|
| `public` | Усі, включно з анонімами (публічний календар) |
| `authenticated` (за замовч.) | Будь-хто, хто увійшов |
| `department` | Члени кафедри заняття, викладачі заняття, студенти його груп, `admin` / `manage_lessons`. Для решти заняття **не існує** (404, а не 403). Потребує `departmentId` |

`ILessonReaderModel` (`@LessonReader()`) описує читача: `isAuthenticated`, `seesAll`, `teacherId`, `departmentId`, `studentGroupId`. `applyVisibility()` накладає правило на QueryBuilder (alias `ls`), `assertCanSeeLesson()` — на завантажене заняття.

### Керування (`ILessonManageScopeModel`, `@LessonScope()`)

- **`ALL`** — `admin` або `manage_lessons`. Будь-яке заняття, будь-який власник і кафедра, можна передати власність (`ownerTeacherId`).
- **`TEACHER`** — будь-хто з профілем викладача. Без профілю → 403 «Only teachers can manage lessons».

Для `TEACHER`:

| Дія | Хто може |
|---|---|
| Створити заняття | Лише на своє ім'я (`ownerTeacherId` = я або не передано); кафедра — жодна або своя. Route guard вимагає `manage_own_lessons` |
| Співвикладачі | Будь-які викладачі з будь-якої кафедри |
| Редагувати все (поля, кафедра, викладачі, редактори, група занять) | Власник (`isOwner`), але передати власність може лише ALL |
| Редагувати лише поля заняття | Редактор (`canEdit`, видає власник). Змінювати `ownerTeacherId`, `teacherIds`, `editorTeacherIds`, `departmentId` не можна |
| Змінити `note` і `delayedDate` (`PATCH /lessons/my/:id`) | Будь-який викладач заняття |
| Видалити заняття, згенерувати серію від нього | Лише власник |
| Використати групу занять (покласти в неї заняття, бачити її) | Творець групи або член її кафедри |
| Редагувати / видалити групу занять | Лише творець групи |

Інваріанти, які перевіряє `LessonsService`:
- рівно один власник, і він автоматично додається до `teacherIds`;
- `editorTeacherIds` ⊆ `teacherIds`; власник у редакторах не зберігається;
- усі викладачі мають існувати;
- `visibility = department` ⇒ `departmentId` не null.

### Шари сервісів

| Сервіс | Роль |
|---|---|
| `LessonAccessService` | Правила: scope, reader, видимість, assert-и |
| `LessonsService` / `LessonsGroupsService` | «Сира» логіка **без перевірок доступу**: CRUD, `buildLessonsQuery`, `getPage` / `getList`, `resolveLessonTeachers`, генерація серій |
| `ManagedLessonsService` / `ManagedLessonGroupsService` | Спершу перевіряють доступ, потім делегують у сирі сервіси. Контролери викликають **лише їх** |
| `MyLessonsService` | «Мої заняття»: викладаю я або вчиться моя група, **незалежно від видимості** |

Нова дія над заняттями: правило → `LessonAccessService`, логіка → `LessonsService`, зв'язка → `Managed*Service`, ендпоінт → контролер з `@LessonScope()` / `@LessonReader()`.

Приховане заняття при редагуванні / видаленні теж дає 404 (`getManagedLessonOrFail` перевіряє видимість через `readerFromScope`).

### Серії занять

- `POST /lessons-groups/with-lessons` — створює групу занять і N занять: або `dates[]`, або `date` + `intervalDays` + `repeatCount` (включно з першим, ≤200).
- `POST /lessons-groups/generate-series` — копіює наявне заняття (`baseLessonId`) на нові дати: `dates[]` або `intervalDays` + `repeatCount` (нові заняття **після** базового). Копіюються викладачі, редактори, групи, кафедра, видимість.
- Заняття створюються в циклі без транзакції: помилка посередині лишає частину серії.

## Карта ендпоінтів

Усі шляхи з префіксом `/api`. 🔓 — без токена, 🔑 — лише токен, інакше — перелічені дозволи (+`admin`).

**auth** — `POST login` 🔓 · `POST register` 🔓 (feature flag) · `POST refresh` (refresh-токен) · `POST logout` 🔑 · `GET/PUT me` 🔑 · `PUT me/password` 🔑 · `POST reset-password` 🔓

**users** — `GET /`, `GET /:id` (read_users) · `POST /`, `PUT /:id`, `POST /:id/password-reset-token`, `POST|PUT|DELETE /:id/teacher`, `POST|PUT|DELETE /:id/student` (manage_users). `PUT` профілю = upsert. Фільтри списку: `search`, `roleIds[]`, `profiles[]` (`teacher` | `student` | `none`).

**roles** — CRUD `/roles` (manage_roles)

**departments** — `GET /`, `GET /:id` (read/manage_departments) · `POST`, `PUT /:id`, `PUT /:id/head`, `PUT /:id/teachers`, `DELETE /:id` (manage_departments)

**student-groups** — `GET` (read_groups) · `POST/PUT/DELETE` (manage_groups)

**group-tags** — `GET /`, `GET /:id` (read_groups) · `POST`, `PUT /:id`, `DELETE /:id`, `GET|PUT|POST /:id/groups`, `DELETE /:id/groups/:groupId` (manage_groups)

**semesters** — CRUD (admin)

**lessons** — `GET list`, `GET list/:id` 🔓/🔑 (з урахуванням видимості; фільтри `teacherId`, `studentGroupId`, `departmentId`, `visibility`, `dateFrom`, `dateTo`; пагінація опційна — без `page`/`pageSize` повертається весь список) · `GET my`, `PATCH my/:id` 🔑 · `POST /` (manage_own_lessons | manage_lessons) · `PATCH /:id`, `DELETE /:id` 🔑 (вирішують прапорці власника / редактора)

**lessons-groups** — `GET list`, `GET list/:id` 🔑 · `POST /`, `POST with-lessons`, `POST generate-series`, `PUT /:id`, `DELETE /:id`, `PUT /:groupId/lessons/:lessonId` (manage_own_lessons | manage_lessons)

**dictionaries** (`{ id, name }[]`) — `permissions`, `roles` (read_roles) · `group-tags`, `group`, `semesters`, `lesson-groups`, `teachers` (`{ id, name, departmentId }`) 🔑 · `departments` (read/manage_departments | read/manage_users)
