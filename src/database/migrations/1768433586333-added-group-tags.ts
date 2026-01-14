import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedGroupTags1768433586333 implements MigrationInterface {
    name = 'AddedGroupTags1768433586333'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "group_tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, CONSTRAINT "PK_0e2f0989ab9196d63f86edcfa66" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "student_groups" DROP COLUMN "studySpecification"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "student_groups" ADD "studySpecification" character varying`);
        await queryRunner.query(`DROP TABLE "group_tags"`);
    }

}
