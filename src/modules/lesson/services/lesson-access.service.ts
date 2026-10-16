import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository, SelectQueryBuilder } from 'typeorm';
import { TeacherEntity } from 'src/modules/users/entities/teacher.entity';
import { Permission } from 'src/shared/models/permission.enum';
import { LessonEntity } from '../entities/lesson.entity';
import { LessonsGroupEntity } from '../entities/lessons-group.entity';
import { ILessonManageScopeModel, LessonManageScopeKind } from '../models/lesson-manage-scope.model';
import { DepartmentEntity } from 'src/modules/departments/entities/department.entity';

export const LESSON_MANAGE_PERMISSIONS = [
  Permission.ADMIN,
  Permission.MANAGE_LESSONS,
  Permission.MANAGE_DEPARTMENT_LESSONS,
  Permission.MANAGE_OWN_LESSONS,
];

/**
 * Decides what a user may create/edit/delete among lessons and lesson groups.
 *
 * - ALL: admin / manage_lessons, no restrictions.
 * - DEPARTMENT: manage_department_lessons + the actor is the configured head of their department
 *   (departments.head_teacher_id). Lessons whose teachers all belong to that department.
 *   The permission alone grants nothing until the head is configured.
 * - OWN: manage_own_lessons.
 *   Lessons where the actor is one of the teachers; co-teachers must be from the actor's department.
 */
@Injectable()
export class LessonAccessService {
  constructor(
    @InjectRepository(TeacherEntity)
    private teachersRepository: Repository<TeacherEntity>,
    @InjectRepository(DepartmentEntity)
    private departmentsRepository: Repository<DepartmentEntity>,
  ) {}

  /**
   * Department the teacher heads, if they have manage_department_lessons
   * and are configured as that department's head. Otherwise null.
   */
  async getHeadedDepartmentId(teacher: TeacherEntity | null, permissions: Permission[]): Promise<string | null> {
    if (!teacher?.departmentId || !permissions.includes(Permission.MANAGE_DEPARTMENT_LESSONS)) {
      return null;
    }
    const isHead = await this.departmentsRepository.exists({
      where: { id: teacher.departmentId, headTeacherId: teacher.id, },
    });
    return isHead ? teacher.departmentId : null;
  }

  async resolveScope(userId: string, permissions: Permission[]): Promise<ILessonManageScopeModel> {
    const teacher = await this.teachersRepository.findOne({ where: { userId, }, });

    if (permissions.includes(Permission.ADMIN) || permissions.includes(Permission.MANAGE_LESSONS)) {
      return { kind: LessonManageScopeKind.ALL, teacher, };
    }

    if (await this.getHeadedDepartmentId(teacher, permissions)) {
      return { kind: LessonManageScopeKind.DEPARTMENT, teacher, };
    }
    if (teacher && permissions.includes(Permission.MANAGE_OWN_LESSONS)) {
      return { kind: LessonManageScopeKind.OWN, teacher, };
    }
    throw new ForbiddenException('You do not have permission to manage lessons');
  }

  async assertCanAssignTeachers(scope: ILessonManageScopeModel, teacherIds: string[] | undefined): Promise<void> {
    if (scope.kind === LessonManageScopeKind.ALL) {
      return;
    }
    const me = scope.teacher!;
    const ids = [...new Set(teacherIds ?? [])];

    if (ids.length === 0) {
      throw new BadRequestException('At least one teacher must be assigned to the lesson');
    }
    if (scope.kind === LessonManageScopeKind.OWN && !ids.includes(me.id)) {
      throw new ForbiddenException('You can only manage lessons where you are one of the teachers');
    }

    const otherIds = ids.filter((id) => id !== me.id);
    if (otherIds.length === 0) {
      return;
    }
    if (!(await this.allTeachersInDepartment(otherIds, me.departmentId))) {
      throw new ForbiddenException('Only teachers of your department can be assigned to the lesson');
    }
  }

  async assertCanManageLesson(scope: ILessonManageScopeModel, lesson: Pick<LessonEntity, 'teacherLessons'>): Promise<void> {
    if (scope.kind === LessonManageScopeKind.ALL) {
      return;
    }
    const me = scope.teacher!;
    const teacherIds = lesson.teacherLessons.map((teacherLesson) => teacherLesson.teacherId);

    const canManage = scope.kind === LessonManageScopeKind.OWN
      ? teacherIds.includes(me.id)
      : teacherIds.length > 0 && await this.allTeachersInDepartment(teacherIds, me.departmentId);

    if (!canManage) {
      throw new ForbiddenException('You do not have access to manage this lesson');
    }
  }

  /** Whether lessons may be put into this group (and whether the group is listed for the actor). */
  canUseGroup(scope: ILessonManageScopeModel, group: Pick<LessonsGroupEntity, 'createdByTeacherId' | 'departmentId'>): boolean {
    if (scope.kind === LessonManageScopeKind.ALL) {
      return true;
    }
    const me = scope.teacher!;
    return group.createdByTeacherId === me.id
      || (!!me.departmentId && group.departmentId === me.departmentId);
  }

  /** Whether the group itself may be edited or deleted. */
  canManageGroup(scope: ILessonManageScopeModel, group: Pick<LessonsGroupEntity, 'createdByTeacherId' | 'departmentId'>): boolean {
    if (scope.kind === LessonManageScopeKind.OWN) {
      return group.createdByTeacherId === scope.teacher!.id;
    }
    return this.canUseGroup(scope, group);
  }

  assertCanUseGroup(scope: ILessonManageScopeModel, group: Pick<LessonsGroupEntity, 'createdByTeacherId' | 'departmentId'>): void {
    if (!this.canUseGroup(scope, group)) {
      throw new ForbiddenException('You do not have access to this lesson group');
    }
  }

  assertCanManageGroup(scope: ILessonManageScopeModel, group: Pick<LessonsGroupEntity, 'createdByTeacherId' | 'departmentId'>): void {
    if (!this.canManageGroup(scope, group)) {
      throw new ForbiddenException('You do not have access to manage this lesson group');
    }
  }

  /** Restricts a lesson-groups query to the groups `canUseGroup` would allow. */
  applyGroupScopeFilter(qb: SelectQueryBuilder<LessonsGroupEntity>, alias: string, scope: ILessonManageScopeModel): void {
    if (scope.kind === LessonManageScopeKind.ALL) {
      return;
    }
    const me = scope.teacher!;
    qb.andWhere(new Brackets((scopeQb) => {
      scopeQb.where(`${alias}.createdByTeacherId = :scopeTeacherId`, { scopeTeacherId: me.id, });
      if (me.departmentId) {
        scopeQb.orWhere(`${alias}.departmentId = :scopeDepartmentId`, { scopeDepartmentId: me.departmentId, });
      }
    }));
  }

  /** Creator fields stamped onto a newly created lesson group. */
  groupOwnership(scope: ILessonManageScopeModel): Pick<LessonsGroupEntity, 'createdByTeacherId' | 'departmentId'> {
    return {
      createdByTeacherId: scope.teacher?.id ?? null,
      departmentId: scope.teacher?.departmentId ?? null,
    };
  }

  private async allTeachersInDepartment(teacherIds: string[], departmentId: string | null): Promise<boolean> {
    if (!departmentId) {
      return false;
    }
    const teachers = await this.teachersRepository.find({
      where: { id: In(teacherIds), },
      select: ['id', 'departmentId',],
    });
    return teachers.length === teacherIds.length
      && teachers.every((teacher) => teacher.departmentId === departmentId);
  }
}
