---
name: scheduler-accounts
description: Доменна логіка акаунтів med-scheduler — JWT access / refresh з ротацією й хешем, logout за refresh-токеном, один активний refresh на користувача, /auth/me, скидання пароля токеном selector.validator без пошти, ієрархія ролей (rank, canManageUser, canManageRole) через AuthorityService, canManage у відповідях, профілі teacher / student (teacherId ≠ userId), кафедри й завідувачі як організаційні дані, додавання дозволу в обох репозиторіях. Використовуй перед змінами в modules/auth, users, roles, departments, у Permission enum чи в правилах «хто ким керує».
---

# Акаунти, ролі, профілі, кафедри

Джерело правди — `docs/domain.md` (розділи «Дозволи», «Ієрархія ролей», «Автентифікація», «Кафедри»). Загальний патерн рівнів доступу — `nest-authorization`.

## 1. Автентифікація (`modules/auth`)

| Що | Як |
|---|---|
| токени | access `{ use: 'access', sub, permissions, roles }` і refresh `{ use: 'refresh', sub }`, **різні секрети**, TTL з env (`config/duration.ts`) |
| refresh | `Authorization: Bearer <refresh>`, звіряється з argon2-хешем `users.refreshToken`, видається нова пара (ротація) |
| сесії | один активний refresh на користувача: новий логін розлогінює інші |
| logout | `POST /auth/logout` з **refresh**-токеном (не access): так клієнт завершує й неактивні збережені акаунти; застарілий refresh → 401 і новішої сесії не чіпає |
| `user` у login / refresh / me | з профілями `teacher` / `student`, `teacher.headOfDepartmentId` |
| `PUT /auth/me` | зміна email (логіна) вимагає `currentPassword`; `PUT /auth/me/password` — завжди поточний пароль |
| свій акаунт | лише через `/auth/me`; через `/users/:id` себе змінити не можна |
| `sub` | `users.id` |

Дозволи в access-токені агрегуються з ролей при login / refresh — після зміни ролей guard їх побачить лише після refresh.

## 2. Скидання пароля без пошти

Адмін: `POST /users/:id/password-reset-token` (з `canManageUser`) → `selector.validator` + `expiresAt`. Користувач: `POST /auth/reset-password`. Validator зберігається argon2-хешем, попередні невикористані токени видаляються, успішне скидання обнуляє refresh. Користувача можна створити без пароля — генерується випадковий, свій задається через токен.

## 3. Ієрархія ролей (`AuthorityService`)

```
rank(u)             = max(rolePriority ролей u), або -1 без ролей (NO_RANK)
canManageUser(A, B) = A ≠ B ∧ rank(A) > rank(B)
canManageRole(A, R) = rank(A) > R.rolePriority ∧ (isAdmin(A) ∨ R.permissions ⊆ permissions(A))
```

| Дія | Перевірка |
|---|---|
| змінити користувача, його профілі, видати reset-токен | `assertCanManageUser` |
| видати / забрати ролі | `canManageUser` + `assertCanManageRoles` для кожної **доданої і забраної** ролі |
| створити роль | `assertCanManageRoles([newRole])` |
| змінити роль | `assertCanManageRoles([currentRole, nextRole])` — поточний **і** новий стан |
| видалити роль | `assertCanManageRoles([role])` |
| читати `GET /users`, `GET /roles` | ієрархією не обмежене; кожен рядок несе `canManage` |

Правила:
- Формула лише в `AuthorityService`; ролі завжди з БД (`getAuthority`), не з токена.
- Рівні за рангом один одним не керують (і два адміни з однаковим пріоритетом теж). Адмін (seed, 100) не створює роль з пріоритетом ≥ 100.
- Новий метод, що змінює чужий акаунт / профіль / ролі, починається з `assertCanManageUser(actorId, targetUserId)` (`UsersService`).
- Список / item повертає `canManage` (`mapper.entityToListItem(row, canManage)`): фронт блокує рядки за ним.

## 4. Профілі

- User має 0..1 `Teacher` і 0..1 `Student`, можливо обидва.
- `TeacherEntity.id` ≠ `UserEntity.id`. Довідник `/dictionaries/teachers` і всі `teacherIds` — id профілів (`{ id, name, departmentId }`).
- `PUT` профілю = upsert. Зміна `departmentId` викладача знімає з нього завідування старою кафедрою.
- Студент: `studentGroupId`, `isGroupMonitor` (староста).

## 5. Кафедри (`modules/departments`)

Організаційні дані, **не** акаунт: ієрархію ролей не перевіряють, лише `manage_departments`.
- `PUT /departments/:id/teachers` — **повний** склад у транзакції: викладачі інших кафедр переводяться, відсутні відв'язуються; завідувач, що пішов, перестає бути завідувачем (і на старій кафедрі).
- `PUT /departments/:id/head` — викладач цієї кафедри або `null`.
- Видалення: у викладачів і груп занять `department_id` → NULL, із занять кафедра зникає (каскад `lesson_departments`).
- Завідування впливає на заняття (`scheduler-lessons`): редагування занять своєї кафедри, scope `department`.

## 6. Дозволи (`Permission`)

| Дозвіл | Дає |
|---|---|
| `admin` | усе (guard пропускає завжди); в ієрархії звільнений лише від умови «свої дозволи» |
| `read_users` / `manage_users` | користувачі, профілі, reset-токени |
| `read_roles` / `manage_roles` | довідник ролей / CRUD (`GET /roles` — `manage_roles`) |
| `read_groups` / `manage_groups` | студентські групи й теги |
| `read_departments` / `manage_departments` | кафедри |
| `read_lessons` / `manage_lessons` | лише адмін-панель занять |
| `read_comments` / `manage_comments` | оголошені, не перевіряються |

Семестри — лише `admin`.

**Новий дозвіл — чотири місця, в одній задачі:**
1. `src/shared/models/permission.enum.ts`;
2. міграція з перестворенням `roles_permissions_enum` (`typeorm-migrations`, розділ про enum; не `ADD VALUE`);
3. фронт `src/interfaces/auth/permission.ts`;
4. фронт `src/configs/permissions.config.ts` + тексти `permissions.json` (uk, en).

Дозвіл додається лише тоді, коли окрема роль домену потребує доступу до групи ендпоінтів; під одну кнопку — ні.

## 7. Чекліст

- [ ] Зміна чужого акаунта / профілю / ролей — через `AuthorityService`, ролі з БД.
- [ ] Ролі перевіряються і додані, і забрані; роль — поточний і новий стан.
- [ ] Відповіді users / roles несуть `canManage`.
- [ ] `teacherId` / `studentId` не плутаються з `users.id`.
- [ ] Кафедри без ієрархії; повний склад — у транзакції.
- [ ] Новий дозвіл — у чотирьох місцях.
- [ ] `docs/domain.md` оновлено.
