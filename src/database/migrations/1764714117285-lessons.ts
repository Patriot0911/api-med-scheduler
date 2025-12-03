import { MigrationInterface, QueryRunner } from "typeorm";

export class Lessons1764714117285 implements MigrationInterface {
    name = 'Lessons1764714117285'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "lessons_group" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "note" character varying, CONSTRAINT "PK_0a55df52bea3eec58e4a86e40f7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "student_groups" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "studyYear" character varying NOT NULL, "studySpecification" character varying, CONSTRAINT "PK_6c41d71f2919cb42d67fb795557" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "lessons" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" TIMESTAMP, "duration" integer NOT NULL, "delayedDate" TIMESTAMP, "name" character varying NOT NULL, "note" character varying, "semesterId" uuid, "lessonGroupId" uuid, CONSTRAINT "PK_9b9a8d455cac672d262d7275730" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_lessons" ("userId" uuid NOT NULL, "lessonId" uuid NOT NULL, CONSTRAINT "PK_4fbe6e53aa8a3f2f68469a13fad" PRIMARY KEY ("userId", "lessonId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f25daf01e7be838fdb8028f814" ON "user_lessons" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_c16d43a0dc2950a6f22f3ca300" ON "user_lessons" ("lessonId") `);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "permissions"`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "permissions" "public"."roles_permissions_enum" array NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD CONSTRAINT "FK_0988c8176b7907e03905bad2a19" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD CONSTRAINT "FK_39c001c73360a85cb0554ba495a" FOREIGN KEY ("lessonGroupId") REFERENCES "lessons_group"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_lessons" ADD CONSTRAINT "FK_f25daf01e7be838fdb8028f814b" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_lessons" ADD CONSTRAINT "FK_c16d43a0dc2950a6f22f3ca3005" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_lessons" DROP CONSTRAINT "FK_c16d43a0dc2950a6f22f3ca3005"`);
        await queryRunner.query(`ALTER TABLE "user_lessons" DROP CONSTRAINT "FK_f25daf01e7be838fdb8028f814b"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP CONSTRAINT "FK_39c001c73360a85cb0554ba495a"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP CONSTRAINT "FK_0988c8176b7907e03905bad2a19"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "permissions"`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "permissions" roles_permissions_enum array NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c16d43a0dc2950a6f22f3ca300"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f25daf01e7be838fdb8028f814"`);
        await queryRunner.query(`DROP TABLE "user_lessons"`);
        await queryRunner.query(`DROP TABLE "lessons"`);
        await queryRunner.query(`DROP TABLE "student_groups"`);
        await queryRunner.query(`DROP TABLE "lessons_group"`);
    }

}
