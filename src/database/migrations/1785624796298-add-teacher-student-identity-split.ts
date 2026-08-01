import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTeacherStudentIdentitySplit1785624796298 implements MigrationInterface {
    name = 'AddTeacherStudentIdentitySplit1785624796298'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "teachers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, CONSTRAINT "UQ_teachers_user_id" UNIQUE ("user_id"), CONSTRAINT "PK_teachers" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "teachers" ADD CONSTRAINT "FK_teachers_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        await queryRunner.query(`CREATE TABLE "students" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "student_group_id" uuid, "is_group_monitor" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_students_user_id" UNIQUE ("user_id"), CONSTRAINT "PK_students" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "students" ADD CONSTRAINT "FK_students_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "students" ADD CONSTRAINT "FK_students_student_group_id" FOREIGN KEY ("student_group_id") REFERENCES "student_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // No existing teacher_lesson data is expected to reference user ids at this point.
        await queryRunner.query(`ALTER TABLE "teacher_lesson" DROP CONSTRAINT "FK_d1e6d3695fe6bdf4a168c22d9f9"`);
        await queryRunner.query(`ALTER TABLE "teacher_lesson" ADD CONSTRAINT "FK_teacher_lesson_teacher_id" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "teacher_lesson" DROP CONSTRAINT "FK_teacher_lesson_teacher_id"`);
        await queryRunner.query(`ALTER TABLE "teacher_lesson" ADD CONSTRAINT "FK_d1e6d3695fe6bdf4a168c22d9f9" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT "FK_students_student_group_id"`);
        await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT "FK_students_user_id"`);
        await queryRunner.query(`DROP TABLE "students"`);

        await queryRunner.query(`ALTER TABLE "teachers" DROP CONSTRAINT "FK_teachers_user_id"`);
        await queryRunner.query(`DROP TABLE "teachers"`);
    }

}
