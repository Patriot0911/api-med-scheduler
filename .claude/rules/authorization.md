---
paths:
  - "src/modules/**/controllers/**"
  - "src/modules/auth/**"
  - "src/modules/roles/**"
  - "src/shared/guards/**"
  - "src/shared/decorator/**"
  - "src/shared/models/permission.enum.ts"
---

# Authorization

Standard decorator set on a protected endpoint:

```ts
@Get()
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, PermissionsGuard)
@Permissions(Permission.READ_USERS, Permission.MANAGE_USERS)
```

Authorization has two levels:

1. **Endpoint access** — `@Permissions` + `PermissionsGuard`. Passes if the user has **at least one** of the listed permissions (OR). **`ADMIN` always passes**, so it is not listed. `@Permissions(Permission.ADMIN)` is written only for admin-only endpoints (semesters). Read — `read_x, manage_x`, write — `manage_x`.
2. **Action on a specific user or role** — the role hierarchy in `AuthorityService` (`modules/roles/services/authority.service.ts`). Any change to another user's account, profiles, roles or reset token goes through it. The formula is in [docs/domain.md](../../docs/domain.md#ієрархія-ролей). Do not write your own "can A change B" checks outside this service.

- The guard reads permissions from the access token (aggregated from roles at login / refresh), so after a role change they update only after refresh. `AuthorityService` always reads roles from the DB.
- users and roles responses carry `canManage`: whether the current user can manage the record. The frontend relies on this flag instead of repeating the formula.
- `OptionalJwtAccessGuard` — for public endpoints (`/lessons/list`): no `Authorization` header → anonymous, an expired token → 401.
- Lessons have their own model: in the teacher domain (`/lessons*`) rights come from participating in the lesson and heading the department, not from permissions (`LessonAccessService`, `@LessonActor()`, no `@Permissions`). The admin panel (`/admin/lessons*`) uses regular `read_lessons` / `manage_lessons` permissions. Details — [docs/domain.md](../../docs/domain.md#заняття--правила-доступу).
- `@Feature('register') + FeatureGuard` enables an endpoint via env (`FEATURE_REGISTER='TRUE'`).

## Adding a new permission

Four places: the enum, a migration that recreates `roles_permissions_enum` (not `ADD VALUE`, commit `0908603`), frontend `permission.ts`, `permissions.config.ts` and `permissions.json`. Step by step — skill `scheduler-accounts`.
