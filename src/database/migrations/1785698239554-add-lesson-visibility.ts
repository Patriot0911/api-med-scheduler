import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLessonVisibility1785698239554 implements MigrationInterface {
    name = 'AddLessonVisibility1785698239554'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."lessons_visibility_enum" AS ENUM('public', 'teachers', 'restricted')`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD "visibility" "public"."lessons_visibility_enum" NOT NULL DEFAULT 'restricted'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN "visibility"`);
        await queryRunner.query(`DROP TYPE "public"."lessons_visibility_enum"`);
    }

}
