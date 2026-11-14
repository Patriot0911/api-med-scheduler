import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * A lesson group is optional: it links series and lessons that belong together, a single lesson needs none.
 * Deleting a group keeps its lessons, they just leave the group.
 * The FK is found by column, not by name: synchronize (dev) may have renamed it.
 */
export class OptionalLessonGroup1785800000007 implements MigrationInterface {
  name = 'OptionalLessonGroup1785800000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.dropLessonGroupForeignKeys(queryRunner);
    await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "lesson_group_id" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "lessons" ADD CONSTRAINT "FK_lessons_lesson_group_id" FOREIGN KEY ("lesson_group_id") REFERENCES "lessons_group"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropLessonGroupForeignKeys(queryRunner);
    // lessons without a group go to one placeholder group, so the column can be required again
    await queryRunner.query(`
      WITH ungrouped AS (
        INSERT INTO "lessons_group" ("name")
        SELECT 'Ungrouped lessons' WHERE EXISTS (SELECT 1 FROM "lessons" WHERE "lesson_group_id" IS NULL)
        RETURNING "id"
      )
      UPDATE "lessons" SET "lesson_group_id" = (SELECT "id" FROM ungrouped) WHERE "lesson_group_id" IS NULL
    `);
    await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "lesson_group_id" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "lessons" ADD CONSTRAINT "FK_1471f19459cbe09229e9ce44adc" FOREIGN KEY ("lesson_group_id") REFERENCES "lessons_group"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }

  private async dropLessonGroupForeignKeys(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE fk record;
      BEGIN
        FOR fk IN
          SELECT con.conname
          FROM pg_constraint con
          JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY (con.conkey)
          WHERE con.conrelid = 'lessons'::regclass AND con.contype = 'f' AND att.attname = 'lesson_group_id'
        LOOP
          EXECUTE format('ALTER TABLE "lessons" DROP CONSTRAINT %I', fk.conname);
        END LOOP;
      END $$;
    `);
  }
}
