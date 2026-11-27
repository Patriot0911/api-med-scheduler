---
paths:
  - "src/modules/**/controllers/**"
  - "src/modules/**/*.module.ts"
---

# Controllers and modules

- `@ApiTags` on every controller. Prefix, response wrapper, current user — `api-conventions.md`; guards and permissions — `authorization.md`.
- Path id — `@Param('xId', ParseUUIDPipe)` in new code.
- A controller is thin: no repositories and no access checks; never returns an entity.
- Dictionary endpoints `{ id, name }` — only in `DictionariesModule`.
- Module: other entities a service uses go into `TypeOrmModule.forFeature([...])`; `exports` — only what other modules need.
- A new / changed endpoint goes into the "Карта ендпоінтів" section of `docs/domain.md`.
