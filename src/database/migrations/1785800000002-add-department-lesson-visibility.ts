import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDepartmentLessonVisibility1785800000002 implements MigrationInterface {
    name = 'AddDepartmentLessonVisibility1785800000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."lessons_visibility_enum" ADD VALUE IF NOT EXISTS 'department' BEFORE 'restricted'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Postgres can't drop enum values: narrow department lessons back to restricted and recreate the type.
        await queryRunner.query(`UPDATE "lessons" SET "visibility" = 'restricted' WHERE "visibility" = 'department'`);
        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "visibility" DROP DEFAULT`);
        await queryRunner.query(`ALTER TYPE "public"."lessons_visibility_enum" RENAME TO "lessons_visibility_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."lessons_visibility_enum" AS ENUM('public', 'teachers', 'restricted')`);
        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "visibility" TYPE "public"."lessons_visibility_enum" USING "visibility"::text::"public"."lessons_visibility_enum"`);
        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "visibility" SET DEFAULT 'restricted'`);
        await queryRunner.query(`DROP TYPE "public"."lessons_visibility_enum_old"`);
    }

}
