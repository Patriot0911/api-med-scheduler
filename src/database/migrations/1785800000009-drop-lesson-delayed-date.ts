import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Lessons are no longer "moved": a lesson has one date, edited directly. A moved lesson keeps the date
 * it was shown at (its delayedDate becomes its date). Guarded: in dev, synchronize runs before migrations
 * and may already have dropped the column.
 */
export class DropLessonDelayedDate1785800000009 implements MigrationInterface {
  name = 'DropLessonDelayedDate1785800000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('lessons', 'delayedDate'))) return;
    await queryRunner.query(`UPDATE "lessons" SET "date" = "delayedDate" WHERE "delayedDate" IS NOT NULL`);
    await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN "delayedDate"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // the original dates of moved lessons are gone: the column comes back empty
    await queryRunner.query(`ALTER TABLE "lessons" ADD "delayedDate" TIMESTAMP WITH TIME ZONE`);
  }
}
