---
name: scheduler-lessons
description: Доменна логіка занять med-scheduler (modules/lesson) — два домени, що свідомо не перетинаються (домен викладачів з правилами участі vs адмін-панель з дозволами), актор ILessonActorModel, шари LessonAccessService / LessonsService / Managed* / MyLessonsService, видимість all / involved (404), scope teaching / department / studying, правила створення (автор серед викладачів, кафедри лише викладачів), групи занять, серії й масові дії, спільні фільтри. Використовуй перед будь-якою зміною в src/modules/lesson, новою дією над заняттями чи групами, зміною правил доступу, видимості, фільтрів або серій.
---

# Заняття (`src/modules/lesson`)

**Джерело правди — `docs/domain.md`** (розділи «Заняття — правила доступу», «Групи занять», «Серії занять», «Фільтри»). Прочитай потрібний розділ до змін; правило, якого там немає, спершу узгодь з користувачем і запиши туди в тій самій задачі. Модель доступу вже переписувалась 5 міграціями — не змінюй її «заодно».

Загальний патерн (рівні авторизації, трійка can / assert / apply, 404 vs 403) — `nest-authorization`. Тут — конкретні правила.

## 1. Два домени

| | Домен викладачів | Адмін-панель |
|---|---|---|
| Шляхи | `/api/lessons*`, `/api/lessons-groups*` | `/api/admin/lessons*`, `/api/admin/lessons-groups*` |
| Контролери | `lessons.controller.ts`, `lessons-groups.controller.ts` | `admin-lessons.controller.ts`, `admin-lessons-groups.controller.ts` |
| Хто вирішує | участь у занятті / завідування (`LessonAccessService`) | `read_lessons` / `manage_lessons` (`admin` завжди) |
| Сервіси | `Managed*Service` → base | base напряму |
| Видимість | застосовується | немає обмежень |
| `canEdit` | рахується для актора | завжди `true` |

`Permission` у домені викладачів **нічого не дає**: адмін без профілю викладача там звичайний користувач. Адмін-дія — окремий ендпоінт в адмін-контролері, а не `if (isAdmin)` у домені викладачів.

## 2. Актор

```ts
@LessonActor() actor: ILessonActorModel    // { userId, teacherId, departmentId, headOfDepartmentId, studentGroupId }
```

- Отримується пайпом `ResolveLessonActorPipe` → `LessonAccessService.resolveActor` (з БД, а не з токена).
- Анонім (`OptionalJwtAccessGuard` без токена) — усі поля `null`.
- `teacherId` — `teachers.id`, **не** `users.id`. Усі `teacherIds` у заняттях — id профілів.
- `departmentId` — кафедра, де викладач працює; `headOfDepartmentId` — кафедра, яку він очолює.

## 3. Правила

| Правило | Метод | SQL-варіант |
|---|---|---|
| редагувати / видаляти: викладач заняття **або** завідувач однієї з його кафедр | `canEdit` / `assertCanEdit` (403) | — |
| бачити: `visibility = all` **або** canEdit **або** студент його групи | `canSee` / `assertCanSee` (**404**) | `applyVisibility` |
| «мої» заняття | — | `applyScope(teaching \| department \| studying)` |
| створювати — лише з профілем викладача | `assertIsTeacher` | — |
| автор серед `teacherIds` | `assertIsAuthorAmongTeachers` (400) | — |
| додані кафедри — лише кафедри викладачів заняття (наявні лишаються) | `assertCanAddLessonDepartments` | — |
| класти в групу: автор групи або член її кафедри | `canUseGroup` / `assertCanUseGroup` | `applyUsableGroups` |
| перейменувати / видалити групу: автор або завідувач її кафедри | `canManageGroup` / `assertCanManageGroup` | — |
| кафедра групи — жодна або власна | `assertCanSetDepartment` | — |

Інваріанти: у заняття завжди ≥ 1 викладач і всі існують (`assertTeachersExist`); викладач може прибрати себе — і втрачає доступ.

Scope-предикати збігаються з частинами `canEdit` / `canSee`, тож видимість «мої» заняття ніколи не ховає. Міняєш один — міняй обидва.

## 4. Шари

```
LessonAccessService          правила й актор; без логіки даних
LessonsService               CRUD, buildLessonsQuery, getPage / getList, assert*Exist; БЕЗ доступу
LessonsGroupsService         те саме для груп і серій
ManagedLessonsService        домен викладачів: assert → base → withCanEdit
ManagedLessonGroupsService
MyLessonsService             /lessons/my: buildLessonsQuery + applyScope
```

Порядок у managed-методі зміни: `getVisibleLessonOrFail` (404) → `assertCanEdit` (403) → перевірки полів (кафедри, група) → base → `withCanEdit(actor, item)`.

### Рецепт нової дії

1. Правило → `docs/domain.md` (таблиця «Хто редагує» / «Групи занять»).
2. Предикат і assert (і `apply*`, якщо правило фільтрує списки) → `LessonAccessService`.
3. Логіка без доступу → `LessonsService` / `LessonsGroupsService`.
4. Зв'язка → `Managed*Service`.
5. Ендпоінт з `@LessonActor()` у контролері домену викладачів.
6. Адмін-варіант (якщо потрібен) → `admin-*.controller.ts` поверх base з `@Permissions(Permission.MANAGE_LESSONS)` (читання — `READ_LESSONS, MANAGE_LESSONS`).
7. Карта ендпоінтів у `domain.md`; контракт для фронту — `api-contract-change`.

## 5. Модель заняття у відповіді

Одна дата `date` (окремого «перенесення» немає — його видалили, не повертай). Відповідь несе id **і** назви для показу: `teachers`, `studentGroups`, `departments` (`{ id, name }[]`), `lessonGroupName` — щоб анонімний `/schedule` обходився без довідників. Нове посилання в занятті → і `xIds`, і `x: { id, name }[]` у mapper.

## 6. Фільтри

Один `buildLessonsQuery(filters)` для `/lessons/list`, `/lessons/my` і `/admin/lessons` (alias `ls`). Масив = «будь-яке зі значень», різні фільтри — AND. Сортування завжди за `ls.date`. Без `page` повертається весь список (календар), формат усе одно `{ items, meta }`. Новий фільтр: поле в базовому DTO фільтрів (`lessons-filters-request.dto.ts`) і моделі → умова в `buildLessonsQuery` → рядок у таблиці фільтрів `domain.md` → фронт (`ILessonsFilters`).

## 7. Групи, серії, масові дії

- Група занять **необов'язкова**; видалення групи лишає заняття без групи (`ON DELETE SET NULL`), адмінка може видалити разом із заняттями (`?withLessons=true`, транзакція).
- Серія: клієнт надсилає готові `dates` (1–200, дублікати відкидаються) — сервер створює рівно їх. Усі посилання (викладачі, кафедри, семестр) перевіряються **до** запису групи; заняття створюються в циклі без транзакції.
- Масові дії (`lessonIds` 1–200): відсутні id пропускаються або дають 400 «нічого не змінено» — як описано для конкретного ендпоінту в `domain.md`; відповідь — кількість.
- Списки груп: сортування за назвою, рядок з `departmentName`, `createdByTeacherName`, `lessonsCount`, `firstLessonDate` / `lastLessonDate`.

## 8. Чекліст

- [ ] Розділ `domain.md` прочитано; нове правило записано туди.
- [ ] Дія в правильному домені; без `Permission` у домені викладачів.
- [ ] Правило лише в `LessonAccessService`; `can*` і `apply*` узгоджені.
- [ ] Приховане — 404, видиме чуже — 403.
- [ ] Base-сервіс без перевірок доступу; відповідь з `canEdit`.
- [ ] `teacherIds` = id профілів.
- [ ] Посилання в моделі мають і id, і назви.
