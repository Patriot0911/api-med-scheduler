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

# Domain rules

- Before changes read the relevant section of `docs/domain.md`; a new or changed rule is written there in the same task. Do not invent a rule that is not there — agree it with the user.
- Lessons: access rules only in `LessonAccessService` (`can*` + `assert*` + `apply*` mean the same thing); logic without access — `LessonsService` / `LessonsGroupsService`; glue — `Managed*Service`; admin variant — `admin-*.controller.ts` on top of the base. `Permission` has no effect in the teacher domain. Hidden → 404, visible but not yours → 403. Details — skill `scheduler-lessons`.
- Accounts: "can A change B / role R" — only `AuthorityService`, roles from the DB; check both added and removed roles; users / roles responses carry `canManage`. Details — skill `scheduler-accounts`.
- `teacherIds` / `teacherId` are `teachers.id`, not `users.id`; `sub` is `users.id`.
- New `Permission` — `authorization.md`, section "Adding a new permission".
- Contract change — skill `api-contract-change`.
