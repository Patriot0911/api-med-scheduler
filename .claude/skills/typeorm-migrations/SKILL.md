---
name: typeorm-migrations
description: Переносні правила зміни схеми в TypeORM + PostgreSQL — entity-конвенції (uuid PK, FK як relation + колонка, snake_case, timestamptz, ON DELETE), ручні міграції raw SQL з явними іменами обмежень, міграція даних і повноцінний down(), ідемпотентність при synchronize у dev, безпечна зміна Postgres-enum (перестворення типу замість ADD VALUE), іменування й таймстемпи, як запускати CLI, не ламаючи nest --watch. Використовуй, коли змінюєш або створюєш entity, колонку, зв'язок, enum, індекс, пишеш чи генеруєш міграцію, або бачиш розбіжність схеми dev і production.
---

# Entity і міграції

## 0. Як запускати команди

Користувач зазвичай тримає `npm run start:dev` (`nest start --watch`, порт 3001) у своєму терміналі. `npm run build` перезаписує `dist/` під watcher-ом і може **вбити dev-сервер**, тому `build` — лише фінальна перевірка наприкінці задачі. Усі скрипти TypeORM (`migration:generate / run / revert`, `seed:run`) спершу роблять `npm run build`.

- Перевірка типів під час роботи — `npx tsc --noEmit -p tsconfig.json`; наприкінці — `npm run build`.
- Міграцію **пиши руками** і не запускай сам: dev-сервер застосує її сам при рестарті (`migrationsRun: true`).
- Якщо `dist/` справді потрібен (генерація, `migration:run`) — спершу попередь користувача й спитай, чи зупинено dev-сервер (`lsof -i :3001`).

## 1. Конвенції entity

```ts
@Entity('departments')
export class DepartmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true, })
  name: string;

  @OneToOne(() => TeacherEntity, (teacher) => teacher.headedDepartment, { nullable: true, onDelete: 'SET NULL', })
  @JoinColumn({ name: 'head_teacher_id' })
  headTeacher?: TeacherEntity | null;

  @Column({ name: 'head_teacher_id', type: 'uuid', nullable: true, unique: true, })
  headTeacherId: string | null;
}
```

| Що | Правило |
|---|---|
| таблиця | snake_case, множина (`student_groups`; винятки історичні: `lessons_group`, `teacher_lesson`) |
| колонка | snake_case через `name:` при camelCase-властивості; старі `users`, `roles`, `semesters` мають camelCase-колонки — у raw SQL беруться в лапки (`"fullName"`) |
| PK | `uuid` |
| FK | і relation, і окрема колонка `xId` з тим самим `name` |
| час | `timestamptz`; текст — `type: 'text'` |
| видалення | `onDelete` вирішується бізнес-правилом (див. `docs/domain.md`): `CASCADE` для join-таблиць, `SET NULL` для необов'язкових зв'язків |
| join-таблиця з даними | окрема entity (`TeacherLessonEntity`), не `@ManyToMany` |

Кожна зміна entity — **разом з міграцією**. У dev `synchronize: true`, тож зміна без міграції «працює» локально і ламає production.

## 2. Файл міграції

```ts
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Lessons are no longer "moved": a lesson has one date, edited directly. A moved lesson keeps the date
 * it was shown at. Guarded: in dev, synchronize runs before migrations and may already have dropped the column.
 */
export class DropLessonDelayedDate1785800000009 implements MigrationInterface {
  name = 'DropLessonDelayedDate1785800000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('lessons', 'delayedDate'))) return;
    await queryRunner.query(`UPDATE "lessons" SET "date" = "delayedDate" WHERE "delayedDate" IS NOT NULL`);
    await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN "delayedDate"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lessons" ADD "delayedDate" TIMESTAMP WITH TIME ZONE`);
  }
}
```

- Файл `src/database/migrations/<timestamp>-<kebab-name>.ts`, клас `<PascalName><timestamp>`, `name` = те саме.
- Таймстемп **більший за останній** (`ls src/database/migrations | tail -1`; зараз ручна серія `17858000000NN` — наступна `+1`).
- Коментар угорі — **єдиний обов'язковий коментар**: що змінюється в бізнес-сенсі й що стається з наявними даними. Усередині — лише неочевидне.
- Raw SQL через `queryRunner.query`, явні імена: `FK_<table>_<column>`, `UQ_<table>_<column>`, `IDX_<table>_<column>`.
- Нова NOT NULL колонка на наявній таблиці: додати nullable → заповнити даними → `SET NOT NULL`.
- Зміна сенсу даних — міграція даних для наявних рядків у тому ж `up()`.
- `down()` повноцінний; якщо дані незворотно втрачаються — відновити схему і пояснити це одним рядком.

## 3. Ідемпотентність через synchronize у dev

`synchronize` у dev виконується **до** міграцій і може вже змінити схему. Тому:
- перевірка перед дією: `hasTable`, `hasColumn`;
- обмеження, які synchronize міг перейменувати, шукати за колонкою в `pg_constraint`, а не за назвою (див. `1785800000007-optional-lesson-group.ts`);
- `migration:generate` по dev-БД може дати порожній diff — генерувати лише по БД, де застосовані тільки міграції.

## 4. Postgres-enum

TypeORM створює для enum-колонки тип (`roles_permissions_enum`, `lessons_visibility_enum`), і він сам не оновлюється.

**Не** `ALTER TYPE ... ADD VALUE`: нове значення не можна використати в тій самій транзакції, а видалити значення з enum неможливо взагалі. Патерн — перестворення типу:

```sql
ALTER TABLE "lessons" ALTER COLUMN "visibility" DROP DEFAULT;
ALTER TYPE "public"."lessons_visibility_enum" RENAME TO "lessons_visibility_enum_old";
CREATE TYPE "public"."lessons_visibility_enum" AS ENUM('all', 'involved');
ALTER TABLE "lessons" ALTER COLUMN "visibility" TYPE "public"."lessons_visibility_enum"
  USING (CASE "visibility"::text WHEN '...' THEN '...' ELSE 'all' END)::"public"."lessons_visibility_enum";
ALTER TABLE "lessons" ALTER COLUMN "visibility" SET DEFAULT 'all';
DROP TYPE "public"."lessons_visibility_enum_old";
```

Для масиву enum (`permissions`) — `USING` з `array_remove` / мапою значень. Видалене значення мапиться в наявне або прибирається з даних явно. Зразки: `1785800000005-simplify-lesson-access.ts`, `1785800000006-flatten-lesson-editing.ts`.

## 5. Seed

`src/database/seeds/` — лише початкові дані (адмін-роль і користувач з `INIT_EMAIL` / `INIT_PASSWORD`). Довідникові дані, потрібні для роботи, — міграцією, не seed-ом.

## 6. Чекліст

- [ ] Entity за конвенціями; `onDelete` відповідає правилу з `domain.md`.
- [ ] Міграція з таймстемпом більшим за останній, класом і `name`.
- [ ] Коментар угорі: бізнес-сенс і доля наявних даних.
- [ ] Явні імена обмежень; NOT NULL через заповнення даних.
- [ ] Ідемпотентність (`hasColumn` / `hasTable`, FK за колонкою).
- [ ] Enum — перестворенням типу.
- [ ] `down()` повноцінний.
- [ ] Не запускав CLI TypeORM без згоди; типи — `tsc --noEmit`, фінально — `npm run build`.
