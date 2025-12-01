import { MigrationInterface, QueryRunner } from "typeorm";

export class AuthRolesSemesters1764609579831 implements MigrationInterface {
    name = 'AuthRolesSemesters1764609579831'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "semesters" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "dateFrom" TIMESTAMP NOT NULL, "dateTo" TIMESTAMP NOT NULL, CONSTRAINT "PK_25c393e2e76b3e32e87a79b1dc2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "rolePriority" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "refreshToken" character varying`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "permissions"`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "permissions" "public"."roles_permissions_enum" array NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "permissions"`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "permissions" roles_permissions_enum array NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "refreshToken"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "rolePriority"`);
        await queryRunner.query(`DROP TABLE "semesters"`);
    }

}
