import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDepartmentHead1785800000003 implements MigrationInterface {
    name = 'AddDepartmentHead1785800000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "departments" ADD "head_teacher_id" uuid`);
        await queryRunner.query(`ALTER TABLE "departments" ADD CONSTRAINT "UQ_departments_head_teacher_id" UNIQUE ("head_teacher_id")`);
        await queryRunner.query(`ALTER TABLE "departments" ADD CONSTRAINT "FK_departments_head_teacher_id" FOREIGN KEY ("head_teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "departments" DROP CONSTRAINT "FK_departments_head_teacher_id"`);
        await queryRunner.query(`ALTER TABLE "departments" DROP CONSTRAINT "UQ_departments_head_teacher_id"`);
        await queryRunner.query(`ALTER TABLE "departments" DROP COLUMN "head_teacher_id"`);
    }

}
