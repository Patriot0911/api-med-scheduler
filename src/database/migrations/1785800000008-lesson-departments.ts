import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * A lesson belongs to any number of departments (lesson_departments) instead of one (lessons.department_id).
 * The head of each of them may edit the lesson. Existing department_id values move to the new table.
 * Guarded: in dev, synchronize runs before migrations and may already have created the table and dropped the column.
 */
export class LessonDepartments1785800000008 implements MigrationInterface {
  name = 'LessonDepartments1785800000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('lesson_departments'))) {
      await queryRunner.query(`
        CREATE TABLE "lesson_departments" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "lesson_id" uuid NOT NULL,
          "department_id" uuid NOT NULL,
          CONSTRAINT "PK_lesson_departments" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_lesson_departments_lesson_department" UNIQUE ("lesson_id", "department_id")
        )
      `);
      await queryRunner.query(`ALTER TABLE "lesson_departments" ADD CONSTRAINT "FK_lesson_departments_lesson_id" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
      await queryRunner.query(`ALTER TABLE "lesson_departments" ADD CONSTRAINT "FK_lesson_departments_department_id" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    if (await queryRunner.hasColumn('lessons', 'department_id')) {
      await queryRunner.query(`
        INSERT INTO "lesson_departments" ("lesson_id", "department_id")
        SELECT "id", "department_id" FROM "lessons" WHERE "department_id" IS NOT NULL
        ON CONFLICT DO NOTHING
      `);
      // the FK is found by column, not by name: synchronize (dev) may have renamed it
      await queryRunner.query(`
        DO $$
        DECLARE fk record;
        BEGIN
          FOR fk IN
            SELECT con.conname
            FROM pg_constraint con
            JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY (con.conkey)
            WHERE con.conrelid = 'lessons'::regclass AND con.contype = 'f' AND att.attname = 'department_id'
          LOOP
            EXECUTE format('ALTER TABLE "lessons" DROP CONSTRAINT %I', fk.conname);
          END LOOP;
        END $$;
      `);
      await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN "department_id"`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // lossy: a lesson keeps one of its departments
    await queryRunner.query(`ALTER TABLE "lessons" ADD "department_id" uuid`);
    await queryRunner.query(`
      UPDATE "lessons" l SET "department_id" = (
        SELECT ld."department_id" FROM "lesson_departments" ld WHERE ld."lesson_id" = l."id" ORDER BY ld."department_id" LIMIT 1
      )
    `);
    await queryRunner.query(`ALTER TABLE "lessons" ADD CONSTRAINT "FK_lessons_department_id" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    await queryRunner.query(`DROP TABLE "lesson_departments"`);
  }
}
