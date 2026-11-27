---
paths:
  - "src/modules/**/entities/**"
  - "src/database/**"
---

# Entities, migrations, seeds

- Outside production `synchronize: true` (`app.module.ts`) and `migrationsRun: true`: the dev server adjusts the schema and applies migrations itself. So an entity change without a migration "works" locally but breaks production, and `migration:generate` against the dev DB may produce an empty diff.
- Every entity change comes with a migration.
- Migration: `src/database/migrations/<timestamp>-<kebab-name>.ts`, timestamp greater than the latest file (recent ones are a manual series `17858000000NN`), class and `name` = `<PascalName><timestamp>`.
- Raw SQL, explicit names `FK_<table>_<column>` / `UQ_` / `IDX_`; a header comment with the business meaning and what happens to existing data; data migration for existing rows; a full `down()`.
- Idempotency: `hasTable` / `hasColumn`; find constraints by column (synchronize may have renamed them).
- Postgres enums — only by recreating the type (rename → create → `ALTER COLUMN ... USING` → drop old), never `ALTER TYPE ... ADD VALUE`.
- Entity: uuid PK, FK as relation + column, snake_case columns via `name:` (legacy `users` / `roles` / `semesters` are camelCase, quoted in SQL), `timestamptz`, `type: 'text'`, `onDelete` per the rule in `docs/domain.md`.
- Do not run migrations yourself (they build `dist/` and break `nest --watch`) — see `commands.md`.
