import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository, SelectQueryBuilder } from 'typeorm';
import { TeacherEntity } from 'src/modules/users/entities/teacher.entity';
import { StudentEntity } from 'src/modules/users/entities/student.entity';
import { DepartmentEntity } from 'src/modules/departments/entities/department.entity';
import { IAccessTokenPayload } from 'src/modules/auth/models/access-token-payload.model';
import { LessonEntity } from '../entities/lesson.entity';
import { LessonsGroupEntity } from '../entities/lessons-group.entity';
import { ILessonActorModel } from '../models/lesson-actor.model';
import { LessonVisibility } from '../models/lesson-visibility.enum';
import { LessonScope } from '../models/lesson-scope.enum';

/** What the access rules need to know about a lesson, from an entity or an item model alike */
export interface ILessonAccessTarget {
  visibility: LessonVisibility;
  departmentIds: string[];
  teacherIds: string[];
  studentGroupIds: string[];
}

type TLessonGroupOwnership = Pick<LessonsGroupEntity, 'createdByTeacherId' | 'departmentId'>;

const ANONYMOUS: ILessonActorModel = {
  userId: null, teacherId: null, departmentId: null, headOfDepartmentId: null, studentGroupId: null,
};

/**
 * Lesson access in the teacher domain. Permissions play no part here: admins act on lessons
 * through the admin endpoints, which have no such restrictions.
 *
 * - edit / delete: the lesson teachers and the head of the lesson's department;
 * - see: everyone for `all` lessons; for `involved` ones the editors and students of the lesson groups.
 */
@Injectable()
export class LessonAccessService {
  constructor(
    @InjectRepository(TeacherEntity)
    private teachersRepository: Repository<TeacherEntity>,
    @InjectRepository(StudentEntity)
    private studentsRepository: Repository<StudentEntity>,
    @InjectRepository(DepartmentEntity)
    private departmentsRepository: Repository<DepartmentEntity>,
  ) {}

  async resolveActor(user: IAccessTokenPayload | undefined): Promise<ILessonActorModel> {
    if (!user) {
      return ANONYMOUS;
    }
    const [teacher, student] = await Promise.all([
      this.teachersRepository.findOne({ where: { userId: user.sub, }, }),
      this.studentsRepository.findOne({ where: { userId: user.sub, }, }),
    ]);
    const headedDepartment = teacher
      ? await this.departmentsRepository.findOne({ where: { headTeacherId: teacher.id, }, })
      : null;
    return {
      userId: user.sub,
      teacherId: teacher?.id ?? null,
      departmentId: teacher?.departmentId ?? null,
      headOfDepartmentId: headedDepartment?.id ?? null,
      studentGroupId: student?.studentGroupId ?? null,
    };
  }

  toAccessTarget(lesson: Pick<LessonEntity, 'visibility' | 'lessonDepartments' | 'teacherLessons' | 'studentGroupLessons'>): ILessonAccessTarget {
    return {
      visibility: lesson.visibility,
      departmentIds: lesson.lessonDepartments.map((lessonDepartment) => lessonDepartment.departmentId),
      teacherIds: lesson.teacherLessons.map((teacherLesson) => teacherLesson.teacherId),
      studentGroupIds: lesson.studentGroupLessons.map((studentGroupLesson) => studentGroupLesson.studentGroupId),
    };
  }

  canEdit(actor: ILessonActorModel, lesson: Pick<ILessonAccessTarget, 'departmentIds' | 'teacherIds'>): boolean {
    return (!!actor.teacherId && lesson.teacherIds.includes(actor.teacherId))
      || (!!actor.headOfDepartmentId && lesson.departmentIds.includes(actor.headOfDepartmentId));
  }

  canSee(actor: ILessonActorModel, lesson: ILessonAccessTarget): boolean {
    return lesson.visibility === LessonVisibility.ALL
      || this.canEdit(actor, lesson)
      || (!!actor.studentGroupId && lesson.studentGroupIds.includes(actor.studentGroupId));
  }

  /** Same rule as canSee, as a query condition on the `ls` alias */
  applyVisibility(lessonsQb: SelectQueryBuilder<LessonEntity>, actor: ILessonActorModel): SelectQueryBuilder<LessonEntity> {
    return lessonsQb.andWhere(new Brackets((visibilityQb) => {
      visibilityQb.where('ls.visibility = :allVisibility', { allVisibility: LessonVisibility.ALL, });
      for (const scope of [LessonScope.TEACHING, LessonScope.DEPARTMENT, LessonScope.STUDYING]) {
        const condition = this.scopeCondition(scope, actor);
        if (condition) {
          visibilityQb.orWhere(condition.sql, condition.params);
        }
      }
    }));
  }

  /**
   * Lessons related to the actor in the given way, or in any of them. Each scope means the actor is involved
   * in the lesson, so visibility never hides such lessons. Nothing matches when the actor has no such relation.
   */
  applyScope(lessonsQb: SelectQueryBuilder<LessonEntity>, actor: ILessonActorModel, scopes: LessonScope[]): SelectQueryBuilder<LessonEntity> {
    const conditions = scopes
      .map((scope) => this.scopeCondition(scope, actor))
      .filter((condition) => condition !== null);
    if (conditions.length === 0) {
      return lessonsQb.andWhere('1 = 0');
    }
    return lessonsQb.andWhere(new Brackets((scopeQb) => {
      conditions.forEach(({ sql, params, }) => scopeQb.orWhere(sql, params));
    }));
  }

  private scopeCondition(scope: LessonScope, actor: ILessonActorModel): { sql: string; params: Record<string, string> } | null {
    switch (scope) {
      case LessonScope.TEACHING:
        return actor.teacherId
          ? {
            sql: 'EXISTS (SELECT 1 FROM teacher_lesson atl WHERE atl.lesson_id = ls.id AND atl.teacher_id = :actorTeacherId)',
            params: { actorTeacherId: actor.teacherId, },
          }
          : null;
      case LessonScope.DEPARTMENT:
        return actor.headOfDepartmentId
          ? {
            sql: 'EXISTS (SELECT 1 FROM lesson_departments ald WHERE ald.lesson_id = ls.id AND ald.department_id = :actorHeadOfDepartmentId)',
            params: { actorHeadOfDepartmentId: actor.headOfDepartmentId, },
          }
          : null;
      case LessonScope.STUDYING:
        return actor.studentGroupId
          ? {
            sql: 'EXISTS (SELECT 1 FROM student_group_lesson asgl WHERE asgl.lesson_id = ls.id AND asgl.student_group_id = :actorStudentGroupId)',
            params: { actorStudentGroupId: actor.studentGroupId, },
          }
          : null;
    }
  }

  /** Hidden lessons are reported as missing, not forbidden */
  assertCanSee(actor: ILessonActorModel, lesson: ILessonAccessTarget): void {
    if (!this.canSee(actor, lesson)) {
      throw new NotFoundException('Lesson not found');
    }
  }

  assertCanEdit(actor: ILessonActorModel, lesson: Pick<ILessonAccessTarget, 'departmentIds' | 'teacherIds'>): void {
    if (!this.canEdit(actor, lesson)) {
      throw new ForbiddenException('Only the lesson teachers and the head of its department can edit the lesson');
    }
  }

  assertIsTeacher(actor: ILessonActorModel): asserts actor is ILessonActorModel & { teacherId: string } {
    if (!actor.teacherId) {
      throw new ForbiddenException('Only teachers can manage lessons');
    }
  }

  /** Whoever creates a lesson teaches it, the head of a department included */
  assertIsAuthorAmongTeachers(actor: ILessonActorModel & { teacherId: string }, teacherIds: string[]): void {
    if (!teacherIds.includes(actor.teacherId)) {
      throw new BadRequestException('Add yourself to the lesson teachers');
    }
  }

  /**
   * A lesson belongs only to departments of its teachers, so it can't be handed to an unrelated department
   * (and its head). Checked for the departments being added; those already on the lesson stay.
   */
  async assertCanAddLessonDepartments(addedDepartmentIds: string[], teacherIds: string[]): Promise<void> {
    if (addedDepartmentIds.length === 0) {
      return;
    }
    const teachers = await this.teachersRepository.find({ where: { id: In(teacherIds), }, select: ['id', 'departmentId',], });
    const teacherDepartmentIds = new Set(teachers.map((teacher) => teacher.departmentId));
    if (addedDepartmentIds.some((departmentId) => !teacherDepartmentIds.has(departmentId))) {
      throw new ForbiddenException('A lesson can belong only to the departments of its teachers');
    }
  }

  /** A teacher may put a lesson group in no department or in their own one */
  async assertCanSetDepartment(actor: ILessonActorModel, departmentId: string | null | undefined): Promise<void> {
    if (!departmentId) {
      return;
    }
    if (actor.departmentId !== departmentId) {
      throw new ForbiddenException('You can only set your own department');
    }
    await this.departmentsRepository.findOneOrFail({ where: { id: departmentId, }, });
  }

  /** Using a group: putting lessons into it. The creator and members of the group's department may */
  canUseGroup(actor: ILessonActorModel, group: TLessonGroupOwnership): boolean {
    return (!!actor.teacherId && group.createdByTeacherId === actor.teacherId)
      || (!!actor.departmentId && group.departmentId === actor.departmentId);
  }

  /** Same rule as canUseGroup, as a query condition on the given lesson group alias */
  applyUsableGroups(groupsQb: SelectQueryBuilder<LessonsGroupEntity>, alias: string, actor: ILessonActorModel): SelectQueryBuilder<LessonsGroupEntity> {
    if (!actor.teacherId) {
      return groupsQb.andWhere('1 = 0');
    }
    return groupsQb.andWhere(new Brackets((usableQb) => {
      usableQb.where(`${alias}.createdByTeacherId = :usableTeacherId`, { usableTeacherId: actor.teacherId, });
      if (actor.departmentId) {
        usableQb.orWhere(`${alias}.departmentId = :usableDepartmentId`, { usableDepartmentId: actor.departmentId, });
      }
    }));
  }

  /** Managing a group: renaming, deleting. The creator and the head of the group's department may */
  canManageGroup(actor: ILessonActorModel, group: TLessonGroupOwnership): boolean {
    return (!!actor.teacherId && group.createdByTeacherId === actor.teacherId)
      || (!!actor.headOfDepartmentId && group.departmentId === actor.headOfDepartmentId);
  }

  assertCanUseGroup(actor: ILessonActorModel, group: TLessonGroupOwnership): void {
    if (!this.canUseGroup(actor, group)) {
      throw new ForbiddenException('You do not have access to this lesson group');
    }
  }

  assertCanManageGroup(actor: ILessonActorModel, group: TLessonGroupOwnership): void {
    if (!this.canManageGroup(actor, group)) {
      throw new ForbiddenException('You do not have access to manage this lesson group');
    }
  }
}
