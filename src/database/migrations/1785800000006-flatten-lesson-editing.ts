import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Flat lesson editing:
 * - teacher_lesson.is_owner / can_edit dropped: every lesson teacher edits the lesson
 *   (plus the head of its department in the teacher domain, and admins through the admin endpoints).
 * - visibility narrowed to all / involved. public → all; authenticated and department → involved,
 *   so no lesson becomes visible to anonymous visitors by this migration.
 * - manage_own_lessons dropped: the teacher domain does not depend on permissions.
 */
export class FlattenLessonEditing1785800000006 implements MigrationInterface {
    name = 'FlattenLessonEditing1785800000006'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_teacher_lesson_owner"`);
        await queryRunner.query(`ALTER TABLE "teacher_lesson" DROP COLUMN "can_edit"`);
        await queryRunner.query(`ALTER TABLE "teacher_lesson" DROP COLUMN "is_owner"`);

        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "visibility" DROP DEFAULT`);
        await queryRunner.query(`ALTER TYPE "public"."lessons_visibility_enum" RENAME TO "lessons_visibility_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."lessons_visibility_enum" AS ENUM('all', 'involved')`);
        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "visibility" TYPE "public"."lessons_visibility_enum" USING (CASE "visibility"::text WHEN 'public' THEN 'all' ELSE 'involved' END)::"public"."lessons_visibility_enum"`);
        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "visibility" SET DEFAULT 'all'`);
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
                'manage_departments'
            );
        `);
        await queryRunner.query(`
            ALTER TABLE "roles" ALTER COLUMN "permissions" TYPE roles_permissions_enum[]
            USING array_remove("permissions"::text[], 'manage_own_lessons')::roles_permissions_enum[]
        `);
        await queryRunner.query(`DROP TYPE roles_permissions_enum_old`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
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
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "permissions" TYPE roles_permissions_enum[] USING "permissions"::text[]::roles_permissions_enum[]`);
        await queryRunner.query(`DROP TYPE roles_permissions_enum_old`);

        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "visibility" DROP DEFAULT`);
        await queryRunner.query(`ALTER TYPE "public"."lessons_visibility_enum" RENAME TO "lessons_visibility_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."lessons_visibility_enum" AS ENUM('public', 'authenticated', 'department')`);
        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "visibility" TYPE "public"."lessons_visibility_enum" USING (CASE WHEN "visibility"::text = 'all' THEN 'public' WHEN "department_id" IS NOT NULL THEN 'department' ELSE 'authenticated' END)::"public"."lessons_visibility_enum"`);
        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "visibility" SET DEFAULT 'authenticated'`);
        await queryRunner.query(`DROP TYPE "public"."lessons_visibility_enum_old"`);

        await queryRunner.query(`ALTER TABLE "teacher_lesson" ADD "is_owner" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "teacher_lesson" ADD "can_edit" boolean NOT NULL DEFAULT false`);
        // Any one teacher becomes the owner, the rest keep editing the lesson as editors.
        await queryRunner.query(`
            UPDATE "teacher_lesson" SET "is_owner" = true
            WHERE "id" IN (SELECT DISTINCT ON ("lesson_id") "id" FROM "teacher_lesson" ORDER BY "lesson_id", "id")
        `);
        await queryRunner.query(`UPDATE "teacher_lesson" SET "can_edit" = true WHERE NOT "is_owner"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_teacher_lesson_owner" ON "teacher_lesson" ("lesson_id") WHERE "is_owner" = true`);
    }

}
