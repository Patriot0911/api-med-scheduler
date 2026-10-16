import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDepartments1785800000000 implements MigrationInterface {
    name = 'AddDepartments1785800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "departments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, CONSTRAINT "UQ_departments_name" UNIQUE ("name"), CONSTRAINT "PK_departments" PRIMARY KEY ("id"))`);

        await queryRunner.query(`ALTER TABLE "teachers" ADD "department_id" uuid`);
        await queryRunner.query(`ALTER TABLE "teachers" ADD CONSTRAINT "FK_teachers_department_id" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TYPE roles_permissions_enum ADD VALUE IF NOT EXISTS 'read_departments'`);
        await queryRunner.query(`ALTER TYPE roles_permissions_enum ADD VALUE IF NOT EXISTS 'manage_departments'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Postgres can't drop enum values, so strip them from roles and recreate the type.
        await queryRunner.query(`UPDATE "roles" SET "permissions" = array_remove(array_remove("permissions", 'read_departments'), 'manage_departments')`);
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

                'admin'
            );
        `);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "permissions" TYPE roles_permissions_enum[] USING "permissions"::text[]::roles_permissions_enum[]`);
        await queryRunner.query(`DROP TYPE roles_permissions_enum_old`);

        await queryRunner.query(`ALTER TABLE "teachers" DROP CONSTRAINT "FK_teachers_department_id"`);
        await queryRunner.query(`ALTER TABLE "teachers" DROP COLUMN "department_id"`);

        await queryRunner.query(`DROP TABLE "departments"`);
    }

}
