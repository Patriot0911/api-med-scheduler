import { MigrationInterface, QueryRunner } from "typeorm";

export class PermissionsUpdate1764720122452 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TYPE roles_permissions_enum ADD VALUE 'read_groups';
            ALTER TYPE roles_permissions_enum ADD VALUE 'edit_groups';
            ALTER TYPE roles_permissions_enum ADD VALUE 'create_groups';
            ALTER TYPE roles_permissions_enum ADD VALUE 'delete_groups';

            ALTER TYPE roles_permissions_enum ADD VALUE 'read_roles';
            ALTER TYPE roles_permissions_enum ADD VALUE 'edit_roles';
            ALTER TYPE roles_permissions_enum ADD VALUE 'create_roles';
            ALTER TYPE roles_permissions_enum ADD VALUE 'delete_roles';

            ALTER TYPE roles_permissions_enum ADD VALUE 'create_users';
            ALTER TYPE roles_permissions_enum ADD VALUE 'edit_users';
            ALTER TYPE roles_permissions_enum ADD VALUE 'edit_users_roles';
            ALTER TYPE roles_permissions_enum ADD VALUE 'delete_users';

            ALTER TYPE roles_permissions_enum ADD VALUE 'create_lessons';
            ALTER TYPE roles_permissions_enum ADD VALUE 'edit_lessons';
            ALTER TYPE roles_permissions_enum ADD VALUE 'delete_lessons';

            ALTER TYPE roles_permissions_enum ADD VALUE 'view_comments';
            ALTER TYPE roles_permissions_enum ADD VALUE 'create_comments';
            ALTER TYPE roles_permissions_enum ADD VALUE 'edit_comments';
            ALTER TYPE roles_permissions_enum ADD VALUE 'delete_comments';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE roles_permissions_enum_old AS ENUM (
                'admin'
            );
        `);

        await queryRunner.query(`
            ALTER TABLE roles
            ALTER COLUMN permissions TYPE roles_permissions_enum_old
            USING permissions::text::roles_permissions_enum_old;
        `);

        await queryRunner.query(`
            DROP TYPE roles_permissions_enum;
        `);

        await queryRunner.query(`
            ALTER TYPE roles_permissions_enum_old RENAME TO roles_permissions_enum;
        `);
    }
}
