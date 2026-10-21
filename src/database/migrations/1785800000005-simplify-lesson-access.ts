import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Simplified lesson access:
 * - teacher_lesson.is_owner: exactly one owner per lesson.
 * - lessons.department_id: the lesson's department (optional), set explicitly on creation.
 * - teacher_lesson.can_edit: co-teachers the owner allowed to edit the lesson.
 * - visibility narrowed to public / authenticated / department (department as a tenant).
 * - manage_department_lessons dropped (department heads no longer manage all department lessons).
 */
export class SimplifyLessonAccess1785800000005 implements MigrationInterface {
    name = 'SimplifyLessonAccess1785800000005'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "teacher_lesson" ADD "is_owner" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "teacher_lesson" ADD "can_edit" boolean NOT NULL DEFAULT false`);
        // Owner of existing lessons: the lesson group's creator when they teach it, otherwise any of the teachers.
        await queryRunner.query(`
            UPDATE "teacher_lesson" SET "is_owner" = true
            WHERE "id" IN (
                SELECT DISTINCT ON (tl."lesson_id") tl."id"
                FROM "teacher_lesson" tl
                INNER JOIN "lessons" l ON l."id" = tl."lesson_id"
                LEFT JOIN "lessons_group" g ON g."id" = l."lesson_group_id"
                ORDER BY tl."lesson_id", (tl."teacher_id" = g."created_by_teacher_id") DESC NULLS LAST, tl."id"
            )
        `);
        // Previously every assigned teacher could manage the lesson: keep them as editors.
        await queryRunner.query(`UPDATE "teacher_lesson" SET "can_edit" = true WHERE NOT "is_owner"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_teacher_lesson_owner" ON "teacher_lesson" ("lesson_id") WHERE "is_owner" = true`);

        // The lesson's department, optional: its owner may have none.
        await queryRunner.query(`ALTER TABLE "lessons" ADD "department_id" uuid`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD CONSTRAINT "FK_lessons_department_id" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE INDEX "IDX_lessons_department_id" ON "lessons" ("department_id")`);
        // Existing lessons: the owner's department.
        await queryRunner.query(`
            UPDATE "lessons" l SET "department_id" = t."department_id"
            FROM "teacher_lesson" tl
            INNER JOIN "teachers" t ON t."id" = tl."teacher_id"
            WHERE tl."lesson_id" = l."id" AND tl."is_owner" = true
        `);

        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "visibility" DROP DEFAULT`);
        await queryRunner.query(`ALTER TYPE "public"."lessons_visibility_enum" RENAME TO "lessons_visibility_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."lessons_visibility_enum" AS ENUM('public', 'authenticated', 'department')`);
        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "visibility" TYPE "public"."lessons_visibility_enum" USING (CASE "visibility"::text WHEN 'public' THEN 'public' WHEN 'department' THEN 'department' ELSE 'authenticated' END)::"public"."lessons_visibility_enum"`);
        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "visibility" SET DEFAULT 'authenticated'`);
        await queryRunner.query(`DROP TYPE "public"."lessons_visibility_enum_old"`);

        await queryRunner.query(`ALTER TYPE roles_permissions_enum RENAME TO roles_permissions_enum_old`);
        await queryRunner.query(`
            CREATE TYPE roles_permissions_enum AS ENUM (
                'read_groups',
                'manage_groups',

                'read_roles',
                'manage_roles',

                'read_users',
                'manage_users',

                'read_lessons',
                'manage_lessons',

                'read_comments',
                'manage_comments',

                'admin',

                'read_departments',
                'manage_departments',

                'manage_own_lessons'
            );
        `);
        // Heads keep managing their own lessons. Done on text[]: the old enum's values may have been added
        // by ADD VALUE earlier in this same transaction, and Postgres forbids comparing against them until commit.
        await queryRunner.query(`
            ALTER TABLE "roles" ALTER COLUMN "permissions" TYPE roles_permissions_enum[] USING (
                CASE WHEN 'manage_department_lessons' = ANY("permissions"::text[]) AND NOT 'manage_own_lessons' = ANY("permissions"::text[])
                    THEN array_append(array_remove("permissions"::text[], 'manage_department_lessons'), 'manage_own_lessons')
                    ELSE array_remove("permissions"::text[], 'manage_department_lessons')
                END
            )::roles_permissions_enum[]
        `);
        await queryRunner.query(`DROP TYPE roles_permissions_enum_old`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE roles_permissions_enum ADD VALUE IF NOT EXISTS 'manage_department_lessons'`);

        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "visibility" DROP DEFAULT`);
        await queryRunner.query(`ALTER TYPE "public"."lessons_visibility_enum" RENAME TO "lessons_visibility_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."lessons_visibility_enum" AS ENUM('public', 'teachers', 'department', 'restricted')`);
        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "visibility" TYPE "public"."lessons_visibility_enum" USING (CASE "visibility"::text WHEN 'public' THEN 'public' WHEN 'department' THEN 'department' ELSE 'restricted' END)::"public"."lessons_visibility_enum"`);
        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "visibility" SET DEFAULT 'restricted'`);
        await queryRunner.query(`DROP TYPE "public"."lessons_visibility_enum_old"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_lessons_department_id"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP CONSTRAINT "FK_lessons_department_id"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN "department_id"`);

        await queryRunner.query(`DROP INDEX "public"."UQ_teacher_lesson_owner"`);
        await queryRunner.query(`ALTER TABLE "teacher_lesson" DROP COLUMN "can_edit"`);
        await queryRunner.query(`ALTER TABLE "teacher_lesson" DROP COLUMN "is_owner"`);
    }

}
