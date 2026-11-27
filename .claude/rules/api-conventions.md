---
paths:
  - "src/modules/**"
  - "src/shared/**"
  - "src/main.ts"
---

# API conventions

- **Prefix** `api/` is written by hand in `@Controller('api/<resource>')`; there is no global prefix.
- **Response wrapper.** `ResponseInterceptor` wraps everything in `{ status: true, data }`. Errors: `{ status: false, message }`, where `message` is a string **or an array of strings** (class-validator errors). Never wrap a response by hand.
- **Lists**: `{ items, meta: { count } }` (`IGenericListPayloadResponse<T>`). Pagination: query `page` (from 1) and `pageSize` (0–100) with `@Type(() => Number)`; search `search` via `ILIKE '%…%'`. Query arrays come as repeated keys; for a single value use `@Transform(toArray)` (see `get-users-request.dto.ts`).
- **CRUD return values** (historical, do not unify without need): `POST` → created item, `PUT` → mostly `boolean` (`!!result.affected`), but users / profiles / lessons return the updated item; `DELETE` → deleted item.
- **ValidationPipe** is global with `transform: true, whitelist: true`: fields without class-validator decorators are **silently dropped**. DTO rules — `dto.md` and skill `nest-dto-validation`.
- **Current user**: new code — `@CurrentUser() { sub, }: IAccessTokenPayload`; old code reads `request.user` via `@Req()`, not to be used in new code. `sub` is `users.id`, **not** the teacher/student profile id.
