import { MigrationInterface, QueryRunner } from "typeorm";

export class AddScopedLessonManagement1785800000001 implements MigrationInterface {
    name = 'AddScopedLessonManagement1785800000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lessons_group" ADD "created_by_teacher_id" uuid`);
        await queryRunner.query(`ALTER TABLE "lessons_group" ADD "department_id" uuid`);
        await queryRunner.query(`ALTER TABLE "lessons_group" ADD CONSTRAINT "FK_lessons_group_created_by_teacher_id" FOREIGN KEY ("created_by_teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lessons_group" ADD CONSTRAINT "FK_lessons_group_department_id" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TYPE roles_permissions_enum ADD VALUE IF NOT EXISTS 'manage_own_lessons'`);
        await queryRunner.query(`ALTER TYPE roles_permissions_enum ADD VALUE IF NOT EXISTS 'manage_department_lessons'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Postgres can't drop enum values, so strip them from roles and recreate the type.
        await queryRunner.query(`UPDATE "roles" SET "permissions" = array_remove(array_remove("permissions", 'manage_own_lessons'), 'manage_department_lessons')`);
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
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "permissions" TYPE roles_permissions_enum[] USING "permissions"::text[]::roles_permissions_enum[]`);
        await queryRunner.query(`DROP TYPE roles_permissions_enum_old`);

        await queryRunner.query(`ALTER TABLE "lessons_group" DROP CONSTRAINT "FK_lessons_group_department_id"`);
        await queryRunner.query(`ALTER TABLE "lessons_group" DROP CONSTRAINT "FK_lessons_group_created_by_teacher_id"`);
        await queryRunner.query(`ALTER TABLE "lessons_group" DROP COLUMN "department_id"`);
        await queryRunner.query(`ALTER TABLE "lessons_group" DROP COLUMN "created_by_teacher_id"`);
    }

}
