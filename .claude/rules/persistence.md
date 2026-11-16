---
paths:
  - "src/modules/**/entities/**"
  - "src/database/**"
---

# Entity, міграції, seed

- Кожна зміна entity — разом з міграцією (у dev `synchronize: true` приховує її відсутність, production зламається).
- Міграція: `src/database/migrations/<timestamp>-<kebab-name>.ts`, таймстемп більший за останній файл, клас і `name` = `<PascalName><timestamp>`.
- Raw SQL, явні імена `FK_<table>_<column>` / `UQ_` / `IDX_`; коментар угорі — бізнес-сенс і доля наявних даних; міграція даних для наявних рядків; повноцінний `down()`.
- Ідемпотентність: `hasTable` / `hasColumn`, обмеження шукати за колонкою (synchronize міг перейменувати).
- Postgres-enum — лише перестворенням типу (rename → create → `ALTER COLUMN ... USING` → drop old), ніколи `ALTER TYPE ... ADD VALUE`.
- Entity: uuid PK, FK як relation + колонка, snake_case-колонки через `name:` (старі `users` / `roles` / `semesters` — camelCase, у SQL у лапках), `timestamptz`, `type: 'text'`, `onDelete` за правилом із `docs/domain.md`.
- Міграції не запускати самому (будують `dist/` і ламають `nest --watch`) — див. `.claude/rules/commands.md`.
