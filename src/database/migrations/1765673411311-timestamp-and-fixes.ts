import { MigrationInterface, QueryRunner } from "typeorm";

export class TimestampAndFixes1765673411311 implements MigrationInterface {
    name = 'TimestampAndFixes1765673411311'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_86033897c009fcca8b6505d6be2"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN "date"`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD "date" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN "delayedDate"`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD "delayedDate" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_86033897c009fcca8b6505d6be2" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_86033897c009fcca8b6505d6be2"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN "delayedDate"`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD "delayedDate" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN "date"`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD "date" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_86033897c009fcca8b6505d6be2" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

}
