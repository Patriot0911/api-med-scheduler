import { PasswordService } from "src/modules/auth/services/password.service";
import { MigrationInterface, QueryRunner } from "typeorm";
import dotenv from 'dotenv';
import { Permission } from "src/shared/models/permission.enum";

dotenv.config();

const { INIT_PASSWORD, INIT_EMAIL, } = process.env;

export class SeedAdmin1764715155324 implements MigrationInterface {
    name = '1764715155324';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const passwordService = new PasswordService();

        const result = await queryRunner.manager.insert('roles', {
            name: 'Admin',
            rolePriority: 100,
            permissions: [ Permission.ADMIN, ],
        });
        const adminRoleId = result.identifiers[0].id;

        const passwordHash = await passwordService.hash(INIT_PASSWORD as string);

        const userResult = await queryRunner.manager.insert('users', {
            email: INIT_EMAIL,
            fullName: 'Administrator',
            password: passwordHash,
        });

        const adminUserId = userResult.identifiers[0].id;

        await queryRunner.query(`
            INSERT INTO user_roles ("userId", "roleId")
            VALUES ('${adminUserId}', '${adminRoleId}');
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM user_roles
            WHERE "roleId" IN (SELECT id FROM roles WHERE name = 'Admin')
               OR "userId" IN (SELECT id FROM users WHERE email = '${INIT_EMAIL}');
        `);

        await queryRunner.query(`
            DELETE FROM users
            WHERE email = 'admin@example.com';
        `);

        await queryRunner.query(`
            DELETE FROM roles
            WHERE name = 'Admin';
        `);
    }
}
