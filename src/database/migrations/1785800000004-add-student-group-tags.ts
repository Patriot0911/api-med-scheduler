import { MigrationInterface, QueryRunner } from "typeorm";

// student_groups <-> group_tags had no join table at all, so every query touching tags failed.
export class AddStudentGroupTags1785800000004 implements MigrationInterface {
    name = 'AddStudentGroupTags1785800000004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "student_group_tags" ("student_group_id" uuid NOT NULL, "group_tag_id" uuid NOT NULL, CONSTRAINT "PK_student_group_tags" PRIMARY KEY ("student_group_id", "group_tag_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_student_group_tags_student_group_id" ON "student_group_tags" ("student_group_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_student_group_tags_group_tag_id" ON "student_group_tags" ("group_tag_id")`);
        await queryRunner.query(`ALTER TABLE "student_group_tags" ADD CONSTRAINT "FK_student_group_tags_student_group_id" FOREIGN KEY ("student_group_id") REFERENCES "student_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "student_group_tags" ADD CONSTRAINT "FK_student_group_tags_group_tag_id" FOREIGN KEY ("group_tag_id") REFERENCES "group_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "student_group_tags" DROP CONSTRAINT "FK_student_group_tags_group_tag_id"`);
        await queryRunner.query(`ALTER TABLE "student_group_tags" DROP CONSTRAINT "FK_student_group_tags_student_group_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_student_group_tags_group_tag_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_student_group_tags_student_group_id"`);
        await queryRunner.query(`DROP TABLE "student_group_tags"`);
    }

}
