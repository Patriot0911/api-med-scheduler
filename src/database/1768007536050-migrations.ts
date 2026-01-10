import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1768007536050 implements MigrationInterface {
    name = 'Migrations1768007536050'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lessons_group" DROP COLUMN "note"`);
        await queryRunner.query(`ALTER TABLE "lessons_group" ADD "note" text`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN "note"`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD "note" text`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "refreshToken"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "refreshToken" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "refreshToken"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "refreshToken" character varying`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN "note"`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD "note" character varying`);
        await queryRunner.query(`ALTER TABLE "lessons_group" DROP COLUMN "note"`);
        await queryRunner.query(`ALTER TABLE "lessons_group" ADD "note" character varying`);
    }

}
