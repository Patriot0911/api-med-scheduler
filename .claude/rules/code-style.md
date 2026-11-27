---
paths:
  - "src/**/*.ts"
  - "test/**/*.ts"
---

# Code style

- **Comments only when warranted.** Zero comments by default, JSDoc included: simple methods, DTOs, models, entity fields, mappers and obvious checks get none. A comment fits only a non-obvious business rule or genuinely complex logic (`/** A head who leaves the department stops being its head */`) and a migration header. Do not restate names. Heavy comments in existing code are not a model.
- Single quotes; trailing comma after the last element in objects and arrays even on one line: `{ where: { id, }, }`, `[A, B,]` (in imports, parameters and calls — only when multiline); semicolons; 2-space indent. Enforced by `@stylistic` in `eslint.config.mjs`; there is no Prettier (it cannot do trailing commas in single-line objects). All of `src` passes `npm run lint:check` with zero errors — CI blocks any violation.
- Cross-module imports are absolute from `src/` (`'src/modules/auth/guards/permission.guard'`), imports within a module are relative.
- Service methods are `async` with an explicit `Promise<IModel>`; services accept and return interfaces from `models/`, not DTOs or entities.
- No `any` in new code.
- Nest exceptions (`BadRequestException`, `ForbiddenException`, `NotFoundException`) with an English end-user message that explains the rule.
- "Must exist" → `findOneOrFail` (→ 404 `Not found`); a specific message → `findOne` + your own exception.
- Check module names and import paths (`semester`, `lesson` are singular), do not guess.
