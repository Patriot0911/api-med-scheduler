import { MigrationInterface, QueryRunner } from "typeorm";

export class AddJoinLessonTablesUpdatePermissions1769878532280 implements MigrationInterface {
    name = 'AddJoinLessonTablesUpdatePermissions1769878532280'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lessons" DROP CONSTRAINT "FK_0988c8176b7907e03905bad2a19"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP CONSTRAINT "FK_39c001c73360a85cb0554ba495a"`);
        await queryRunner.query(`CREATE TABLE "student_group_lesson" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lesson_id" uuid NOT NULL, "student_group_id" uuid NOT NULL, CONSTRAINT "PK_40e85be9095e697457a3ad50420" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "teacher_lesson" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lesson_id" uuid NOT NULL, "teacher_id" uuid NOT NULL, CONSTRAINT "PK_8d6ce10e828ddaf1d5ed8162f71" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN "semesterId"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN "lessonGroupId"`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD "semester_id" uuid NULL`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD "lesson_group_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "student_group_lesson" ADD CONSTRAINT "FK_e101daa5f7aa41dbc1d3586e8d2" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "student_group_lesson" ADD CONSTRAINT "FK_d96ad9f0376b244e6cfb762c41f" FOREIGN KEY ("student_group_id") REFERENCES "student_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD CONSTRAINT "FK_f8cc00c650e301141d9a61f9064" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD CONSTRAINT "FK_1471f19459cbe09229e9ce44adc" FOREIGN KEY ("lesson_group_id") REFERENCES "lessons_group"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "teacher_lesson" ADD CONSTRAINT "FK_eff0583a4474367580cfdcc5bef" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "teacher_lesson" ADD CONSTRAINT "FK_d1e6d3695fe6bdf4a168c22d9f9" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        await queryRunner.query(`
            ALTER TABLE roles
            DROP COLUMN permissions;
        `);

        await queryRunner.query(`
            DROP TYPE roles_permissions_enum;
        `);

        await queryRunner.query(`
            CREATE TYPE roles_permissions_enum AS ENUM (
                'read_groups',
                'manage_groups',

                'read_roles',
                'manage_roles',

                'read_users',
                'manage_users',

                'read_lessons',
                'manage_lessons',

                'read_comments',
                'manage_comments',

                'admin'
            );
        `);

        await queryRunner.query(`
            ALTER TABLE roles
            ADD COLUMN permissions roles_permissions_enum array NOT NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "teacher_lesson" DROP CONSTRAINT "FK_d1e6d3695fe6bdf4a168c22d9f9"`);
        await queryRunner.query(`ALTER TABLE "teacher_lesson" DROP CONSTRAINT "FK_eff0583a4474367580cfdcc5bef"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP CONSTRAINT "FK_1471f19459cbe09229e9ce44adc"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP CONSTRAINT "FK_f8cc00c650e301141d9a61f9064"`);
        await queryRunner.query(`ALTER TABLE "student_group_lesson" DROP CONSTRAINT "FK_d96ad9f0376b244e6cfb762c41f"`);
        await queryRunner.query(`ALTER TABLE "student_group_lesson" DROP CONSTRAINT "FK_e101daa5f7aa41dbc1d3586e8d2"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN "lesson_group_id"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP COLUMN "semester_id"`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD "lessonGroupId" uuid`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD "semesterId" uuid`);
        await queryRunner.query(`DROP TABLE "teacher_lesson"`);
        await queryRunner.query(`DROP TABLE "student_group_lesson"`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD CONSTRAINT "FK_39c001c73360a85cb0554ba495a" FOREIGN KEY ("lessonGroupId") REFERENCES "lessons_group"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD CONSTRAINT "FK_0988c8176b7907e03905bad2a19" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        await queryRunner.query(`
            ALTER TABLE roles
            DROP COLUMN permissions;
        `);

        await queryRunner.query(`
            DROP TYPE roles_permissions_enum;
        `);

        await queryRunner.query(`
            CREATE TYPE roles_permissions_enum AS ENUM (
                'read_groups',
                'edit_groups',
                'create_groups',
                'delete_groups',

                'read_roles',
                'edit_roles',
                'create_roles',
                'delete_roles',

                'create_users',
                'edit_users',
                'edit_users_roles',
                'delete_users',

                'create_lessons',
                'edit_lessons',
                'delete_lessons',

                'view_comments',
                'create_comments',
                'edit_comments',
                'delete_comments',

                'admin'
            );
        `);

        await queryRunner.query(`
            ALTER TABLE roles
            ADD COLUMN permissions roles_permissions_enum array NOT NULL;
        `);
    }

}
