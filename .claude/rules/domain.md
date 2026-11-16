---
paths:
  - "src/modules/lesson/**"
  - "src/modules/users/**"
  - "src/modules/roles/**"
  - "src/modules/auth/**"
  - "src/modules/departments/**"
  - "src/shared/models/permission.enum.ts"
  - "docs/domain.md"
---

# Доменні правила

- Перед змінами прочитай відповідний розділ `docs/domain.md`; нове чи змінене правило записується туди в тій самій задачі. Правило, якого там немає, не вигадувати — узгодити з користувачем.
- Заняття: правила доступу лише в `LessonAccessService` (`can*` + `assert*` + `apply*` означають одне й те саме); логіка без доступу — `LessonsService` / `LessonsGroupsService`; зв'язка — `Managed*Service`; адмін-варіант — `admin-*.controller.ts` поверх base. `Permission` у домені викладачів не діє. Приховане — 404, видиме чуже — 403. Деталі — скіл `scheduler-lessons`.
- Акаунти: «чи може A змінити B / роль R» — лише `AuthorityService`, ролі з БД; ролі перевіряються і додані, і забрані; відповіді users / roles несуть `canManage`. Деталі — скіл `scheduler-accounts`.
- `teacherIds` / `teacherId` — `teachers.id`, не `users.id`; `sub` — `users.id`.
- Новий `Permission` — enum + міграція перестворення типу + фронт (`permission.ts`, `permissions.config.ts`, `permissions.json`).
- Зміна контракту — скіл `api-contract-change`.
