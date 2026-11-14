# Доменна модель і бізнес-правила

Контекст: розклад занять медичного університету. Адміністратор веде довідники (кафедри, групи, семестри, ролі) і користувачів. Викладачі створюють заняття й серії занять. Студенти та викладачі дивляться свій розклад, а публічні заняття видно анонімно в публічному календарі (`/schedule` на фронті).

## Сутності

```
User ──< user_roles >── Role (permissions: Permission[], rolePriority)
 │
 ├── 0..1 Teacher ──> 0..1 Department ── 0..1 headTeacher (Teacher цієї ж кафедри)
 └── 0..1 Student ──> 0..1 StudentGroup ──< student_group_tags >── GroupTag

Lesson ──> LessonsGroup? (необов'язково)       LessonsGroup ──> createdByTeacher?, department?
   │──> Semester?
   ├──< lesson_departments >── Department
   ├──< teacher_lesson (teacherId) >── Teacher
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
| `LessonsGroupEntity` | `lessons_group` | Серія або логічно пов'язані заняття («Анатомія, лекція»). Має творця-викладача і, за бажанням, кафедру. Заняттю група не обов'язкова; видалення групи лишає її заняття без групи (`ON DELETE SET NULL`) |
| `LessonEntity` | `lessons` | Одне заняття: `date`, `duration` (хв, ≥5), `note`, `visibility`, `semesterId?`, `lessonGroupId?`. Окремого «перенесення» немає: щоб перенести заняття, редагують його `date` |
| `LessonDepartmentEntity` | `lesson_departments` | Кафедри заняття (0..N). Завідувач кожної з них редагує заняття й бачить його |
| `TeacherLessonEntity` | `teacher_lesson` | Викладачі заняття. Усі рівні: кожен може редагувати заняття |
| `StudentGroupLessonEntity` | `student_group_lesson` | Групи, для яких проводиться заняття |
| `PasswordResetTokenEntity` | `password_reset_tokens` | Токен скидання пароля у форматі selector/validator |

**Ідентичність.** Один user може мати одночасно профіль викладача і профіль студента, або жодного. Усі `teacherIds` у заняттях і довіднику `/dictionaries/teachers` — це `teachers.id`, **не** `users.id`.

## Дозволи (`Permission`)

| Дозвіл | Що дає |
|---|---|
| `admin` | Усе: `PermissionsGuard` пропускає його на будь-який ендпоінт. В ієрархії ролей звільнений від умови «лише свої дозволи», але не від рангу. Бачить усі заняття й керує ними |
| `read_users` / `manage_users` | Список користувачів / створення, редагування, профілі, токени скидання пароля |
| `read_roles` / `manage_roles` | Довідник ролей і дозволів / CRUD ролей (`GET /roles` вимагає `manage_roles`) |
| `read_groups` / `manage_groups` | Студентські групи та теги |
| `read_departments` / `manage_departments` | Кафедри, завідувач, склад кафедри |
| `read_lessons` / `manage_lessons` | Адмін-панель занять (`/admin/lessons*`): перегляд / усі зміни. У домені викладачів дозволи не діють |
| `read_comments`, `manage_comments` | Оголошені, але в коді поки не перевіряються |

Семестри (CRUD) доступні лише `admin`.

## Ієрархія ролей

Дозвіл відкриває ендпоінт, а ієрархія вирішує, **над ким** дозволено діяти. Реалізація — `AuthorityService` (`modules/roles/services/authority.service.ts`), дані завжди беруться з БД.

```
rank(u)             = max(rolePriority ролей u), або -1, якщо ролей немає
isAdmin(u)          = admin ∈ permissions(u)

canManageUser(A, B) = A ≠ B ∧ rank(A) > rank(B)
canManageRole(A, R) = rank(A) > R.rolePriority ∧ (isAdmin(A) ∨ R.permissions ⊆ permissions(A))
```

| Дія | Умова |
|---|---|
| Змінити користувача, його профілі teacher / student, видати reset-токен | `canManageUser` |
| Видати / забрати ролі (при створенні та редагуванні) | `canManageUser` + `canManageRole` для кожної доданої **і** забраної ролі |
| Створити роль | `canManageRole` для нової ролі (її пріоритет < мій ранг) |
| Змінити роль | `canManageRole` для поточного **і** нового стану ролі |
| Видалити роль | `canManageRole` |

Наслідки:
- Рівні за рангом не керують один одним, і це стосується й двох адмінів з однаковим пріоритетом.
- Адмін (seed, пріоритет 100) не може створити роль з пріоритетом ≥ 100.
- Своїм акаунтом керують лише через `/auth/me` (зміна email і пароля з поточним паролем). Через `/users/:id` себе змінити не можна.
- Видавати ролі можна лише нижчі за свій ранг, тож підняти комусь ранг до свого або вище неможливо.
- Читання (`GET /users`, `GET /roles`) ієрархією не обмежене. Відповідь містить `canManage` для поточного користувача.
- Кафедри (`PUT /departments/:id/teachers`, `head`) ієрархію не перевіряють: це організаційні дані, а не акаунт.

## Автентифікація

- `POST /auth/login` → `{ tokens: { accessToken, refreshToken }, user }`. Access-токен містить `{ use: 'access', sub, permissions, roles }`, refresh — `{ use: 'refresh', sub }`. Секрети різні.
- `user` (у login, refresh і `GET /auth/me`) містить профілі `teacher` / `student`. `teacher.headOfDepartmentId` — кафедра, яку користувач очолює, або `null`: за ним фронт вирішує, чи показувати заняття кафедри.
- `POST /auth/refresh` з `Authorization: Bearer <refreshToken>`: токен звіряється з хешем у `users.refreshToken`, видається нова пара (ротація). Один активний refresh на користувача: новий логін розлогінює інші сесії.
- `POST /auth/logout` обнуляє `refreshToken`.
- `PUT /auth/me` — зміна email вимагає `currentPassword` (email — це логін). `PUT /auth/me/password` завжди вимагає поточний пароль.
- Скидання пароля без пошти: адмін викликає `POST /users/:id/password-reset-token` і отримує `selector.validator` + `expiresAt`, передає користувачу, той викликає `POST /auth/reset-password`. Попередні невикористані токени видаляються; validator зберігається як argon2-хеш; успішне скидання обнуляє refresh-токен.
- Адмін може створити користувача без пароля: генерується випадковий, і користувач задає свій через токен скидання.

## Кафедри

- `PUT /departments/:id/teachers` — **повний** склад: викладачі з інших кафедр переводяться сюди, відсутні в списку відв'язуються. Усе в транзакції. Завідувач, що пішов з кафедри, перестає бути завідувачем (і на старій кафедрі теж).
- `PUT /departments/:id/head` — `teacherId` має належати цій кафедрі; `null` знімає завідувача.
- Зміна `departmentId` профілю викладача (`PUT /users/:id/teacher`) теж знімає з нього завідування старою кафедрою.
- Видалення кафедри: у викладачів і груп занять `department_id` стає NULL (`ON DELETE SET NULL`), із занять вона просто зникає (рядки `lesson_departments` видаляються каскадно).
- Завідувач кафедри редагує всі заняття, серед кафедр яких є його кафедра (`lesson_departments`), і керує групами занять своєї кафедри (див. нижче).

## Заняття — правила доступу

Заняття живуть у двох доменах, і вони свідомо не перетинаються:

- **Домен викладачів** (`/lessons`, `/lessons-groups`). Права визначаються лише участю в занятті та завідуванням кафедрою, дозволи (`Permission`) тут ролі **не грають**. Правила — `services/lesson-access.service.ts`.
- **Адмін-панель** (`/admin/lessons`, `/admin/lessons-groups`). Доступ дає `read_lessons` / `manage_lessons` (admin проходить завжди). Будь-які заняття, без обмежень видимості, складу викладачів чи кафедри. Адмін без профілю викладача в домені викладачів не має жодних особливих прав.

### Хто редагує

| Хто | Що може |
|---|---|
| Будь-який викладач заняття (`teacher_lesson`) | Усе: поля, кафедри, склад викладачів і груп, групу занять, видалення, генерацію серії від заняття |
| Завідувач кафедри | Те саме для всіх занять, серед кафедр яких є його, навіть якщо він їх не викладає |
| Адмін | Усе через адмін-панель |

Правила створення в домені викладачів:
- створювати може лише користувач із профілем викладача;
- автор **завжди** серед `teacherIds`, зокрема завідувач, що створює заняття своєї кафедри (інакше 400; `LessonAccessService.assertIsAuthorAmongTeachers`). Те саме для `POST /lessons-groups/with-lessons`. Адмінки це не стосується;
- кафедри (`departmentIds`, 0..N) — лише кафедри викладачів цього заняття (свою й співвикладачів), щоб заняття не можна було передати непов'язаній кафедрі та її завідувачу. Перевіряються лише **додані** кафедри: наявні лишаються, навіть якщо їхній викладач пішов із заняття. Адмін ставить будь-які (`LessonAccessService.assertCanAddLessonDepartments`);
- співвикладачі можуть бути з будь-якої кафедри;
- група занять **необов'язкова**: це зв'язка для серій і логічно пов'язаних занять, а не атрибут кожного заняття. `lessonGroupId` (якщо є) — група, яку автор може використати; `null` у `PATCH` виймає заняття з групи;
- `semesterId` опційний.

Інваріанти: у заняття завжди є хоча б один викладач, і всі вони існують (`LessonsService.assertTeachersExist`). Викладач може прибрати себе із заняття і після цього втрачає доступ.

### Видимість (`LessonVisibility`)

| Значення | Хто бачить |
|---|---|
| `all` (за замовч.) | Усі, включно з анонімами публічного розкладу |
| `involved` | Викладачі заняття, завідувачі його кафедр, студенти його груп. Для решти заняття **не існує** (404, а не 403) |

`ILessonActorModel` (`@LessonActor()`) описує користувача в домені викладачів: `teacherId`, `departmentId` (кафедра викладача), `headOfDepartmentId`, `studentGroupId`. Для аноніма всі поля `null`. Для прихованого заняття редагування й видалення теж дають 404; для видимого, але чужого — 403.

Кожне заняття у відповіді має `canEdit` для поточного користувача (у адмін-панелі завжди `true`).

Крім id (`teacherIds`, `studentGroupIds`, `departmentIds`, `lessonGroupId`) заняття у відповіді несе назви для показу: `teachers` / `studentGroups` / `departments` (`{ id, name }[]`), `lessonGroupName`. Тож клієнтам, зокрема анонімному `/schedule`, довідники не потрібні.

### Мої заняття (`LessonScope`)

`GET /lessons/my?scope=` — заняття, пов'язані з користувачем. Предикати живуть у `LessonAccessService.applyScope` і збігаються з частинами `canEdit` / `canSee`, тож видимість такі заняття ніколи не ховає.

| `scope` | Що повертає | Для кого порожньо |
|---|---|---|
| `teaching` | я серед викладачів заняття (сам чи разом з іншими) | немає профілю викладача |
| `department` | серед кафедр заняття є та, яку я очолюю | не завідувач |
| `studying` | заняття моєї студентської групи | немає профілю студента або групи |
| без `scope` | `teaching` ∪ `studying` | |

«Усі доступні заняття» — це `GET /lessons/list`: публічні плюс приховані, у яких я учасник.

### Фільтри списків занять

Спільні для `/lessons/list`, `/lessons/my` і `/admin/lessons` (`LessonsService.buildLessonsQuery`). Масив означає «будь-яке зі значень», різні фільтри поєднуються через AND.

| Фільтр | Суть |
|---|---|
| `dateFrom`, `dateTo` | межі `lessons.date`; за нею ж сортуються всі списки |
| `search` | `ILIKE` за назвою й нотаткою заняття, назвою групи занять (курсу), ПІБ викладачів, назвами студентських груп |
| `teacherIds[]`, `studentGroupIds[]`, `departmentIds[]`, `lessonGroupIds[]`, `semesterIds[]` | за відповідними зв'язками |
| `withoutLessonGroup` | лише заняття без групи (`true` / `1`) |
| `groupTagIds[]` | заняття, де хоча б одна студентська група має один із тегів |
| `visibility` | звужує те, що користувач і так бачить |
| `page`, `pageSize` | опційно; без них повертається весь список (для календаря), завжди у форматі `{ items, meta }` і за датою |

### Групи занять

| Дія | Хто може (домен викладачів) |
|---|---|
| Бачити список | Будь-хто з токеном. `GET /lessons-groups/usable` — лише ті, куди я можу класти заняття (`{ id, name }[]` для селекта; `LessonAccessService.applyUsableGroups`) |
| Створити | Викладач; кафедра — жодна або власна. Автор записується в `createdByTeacherId` |
| Покласти в групу заняття, згенерувати серію в ній | Автор групи або член її кафедри (і заняття має бути доступне для редагування) |
| Перейменувати / видалити | Автор групи або завідувач її кафедри |

### Шари сервісів

| Сервіс | Роль |
|---|---|
| `LessonAccessService` | Правила домену викладачів: actor, `canEdit`, `canSee`, `applyVisibility`, групи, assert-и |
| `LessonsService` / `LessonsGroupsService` | Логіка **без перевірок доступу**: CRUD, `buildLessonsQuery`, `getPage` / `getList`, серії. Адмін-контролери викликають їх напряму |
| `ManagedLessonsService` / `ManagedLessonGroupsService` | Домен викладачів: спершу правила, потім базові сервіси, і `canEdit` перераховується для actor-а |
| `MyLessonsService` | `/lessons/my`: базовий запит + `applyScope` |

Нова дія над заняттями: правило → `LessonAccessService`, логіка → `LessonsService`, зв'язка → `Managed*Service`, ендпоінт → контролер з `@LessonActor()`. Адмін-варіант — в `admin-*.controller.ts` поверх базового сервісу.

Список груп занять (`GET /lessons-groups/list`, `GET /admin/lessons-groups`) відсортований за назвою; кожен рядок має `departmentName`, `createdByTeacherName`, `lessonsCount` і період `firstLessonDate`–`lastLessonDate` (найраніша й найпізніша `date` її занять).

### Серії занять

- `POST /lessons-groups/with-lessons` — нова група й заняття на кожну з дат: `{ lessonGroup: { name, note? }, lesson: <поля POST /lessons без date і lessonGroupId>, dates: Date[] (1–200) }`. Дати — готовий список: правило повторення (щодня, по днях тижня, раз на два тижні, вручну) будує клієнт, тож сервер створює рівно те, що користувач бачив у попередньому перегляді; дублікати відкидаються, заняття йдуть за датою. Ті самі правила, що й для одного заняття (автор серед викладачів, кафедри викладачів); усі посилання (викладачі, кафедри, семестр) перевіряються до запису групи. Автор — `createdByTeacherId` групи, кафедри в групи немає.
- `POST /lessons-groups/:lessonGroupId/lessons` — заняття в **наявну** групу на кожну з дат: `{ lesson, dates }` (той самий формат без `lessonGroup`). Крім правил заняття, автор має могти використати групу (`canUseGroup`). `GET /lessons-groups/my` — групи, автор яких я (`{ id, name }[]` для вибору наявної групи у формі).
- `POST /lessons-groups/generate-series` — копіює наявне заняття (`baseLessonId`) на нові дати: `dates[]` або `intervalDays` + `repeatCount` (нові заняття **після** базового). Копіюються викладачі, групи, кафедри, видимість. Базове заняття має бути в групі (інакше 400): серія живе в групі.
- Заняття створюються в циклі без транзакції; помилки вхідних даних відсікаються перевірками до запису, тож частину серії може лишити лише збій самої БД.
- Обидва ендпоінти мають адмін-аналоги в `/admin/lessons-groups`.

### Керування групою (адмінка)

- `DELETE /admin/lessons-groups/:id?withLessons=true` — разом із заняттями групи (в одній транзакції); без параметра заняття лишаються без групи.
- `PUT /admin/lessons-groups/:id/lessons` `{ lessonIds }` (1–200) — наявні заняття в групу, зокрема з іншої групи; усі мають існувати (інакше 400, нічого не змінюється). Відповідь — кількість.
- `POST /admin/lessons-groups/:id/lessons/remove` `{ lessonIds }` — виймає заняття з **цієї** групи (заняття інших груп не чіпає); відповідь — скільки вийнято.
- `POST /admin/lessons/delete` `{ lessonIds }` — кілька занять одразу; відсутні id пропускаються, відповідь — скільки видалено.

## Карта ендпоінтів

Усі шляхи з префіксом `/api`. 🔓 — без токена, 🔑 — лише токен, інакше — перелічені дозволи (`admin` проходить завжди). Зміни users і roles додатково перевіряються ієрархією ролей.

**auth** — `POST login` 🔓 · `POST register` 🔓 (feature flag) · `POST refresh` (refresh-токен) · `POST logout` 🔑 · `GET/PUT me` 🔑 · `PUT me/password` 🔑 · `POST reset-password` 🔓

**users** — `GET /`, `GET /:id` (read_users) · `POST /`, `PUT /:id`, `POST /:id/password-reset-token`, `POST|PUT|DELETE /:id/teacher`, `POST|PUT|DELETE /:id/student` (manage_users). `PUT` профілю = upsert. Фільтри списку: `search`, `roleIds[]`, `profiles[]` (`teacher` | `student` | `none`).

**roles** — CRUD `/roles` (manage_roles)

**departments** — `GET /`, `GET /:id` (read/manage_departments) · `POST`, `PUT /:id`, `PUT /:id/head`, `PUT /:id/teachers`, `DELETE /:id` (manage_departments)

**student-groups** — `GET` (read_groups) · `POST/PUT/DELETE` (manage_groups)

**group-tags** — `GET /`, `GET /:id` (read_groups) · `POST`, `PUT /:id`, `DELETE /:id`, `GET|PUT|POST /:id/groups`, `DELETE /:id/groups/:groupId` (manage_groups)

**semesters** — CRUD (admin)

**lessons** (домен викладачів) — `GET list`, `GET list/:id` 🔓/🔑 (з урахуванням видимості; фільтри й пагінація — див. [Фільтри списків занять](#фільтри-списків-занять)) · `GET my` 🔑 (`scope`, ті самі фільтри) · `POST /`, `PATCH /:id`, `DELETE /:id` 🔑 (вирішують правила `LessonAccessService`)

**lessons-groups** (домен викладачів) — усе 🔑: `GET list`, `GET my`, `GET usable`, `GET list/:id`, `POST /:groupId/lessons`, `POST /`, `POST with-lessons`, `POST generate-series`, `PUT /:id`, `DELETE /:id`, `PUT /:groupId/lessons/:lessonId`

**admin/lessons** — `GET /`, `GET /:id` (read/manage_lessons) · `POST /`, `PATCH /:id`, `DELETE /:id`, `POST delete` (manage_lessons)

**admin/lessons-groups** — `GET /`, `GET /:id` (read/manage_lessons) · `POST /`, `POST with-lessons`, `POST /:groupId/lessons`, `POST generate-series`, `PUT /:id`, `DELETE /:id` (`?withLessons`), `PUT /:groupId/lessons/:lessonId`, `PUT /:groupId/lessons`, `POST /:groupId/lessons/remove` (manage_lessons)

**dictionaries** (`{ id, name }[]`) — `permissions`, `roles` (read_roles) · `group-tags`, `group`, `semesters`, `lesson-groups`, `teachers` (`{ id, name, departmentId }`), `departments` 🔑 (фільтри занять для всіх)
