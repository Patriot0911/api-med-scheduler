import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { TeacherEntity } from 'src/modules/users/entities/teacher.entity';
import { StudentEntity } from 'src/modules/users/entities/student.entity';
import { IAccessTokenPayload } from 'src/modules/auth/models/access-token-payload.model';
import { DepartmentEntity } from 'src/modules/departments/entities/department.entity';
import { Permission } from 'src/shared/models/permission.enum';
import { LessonEntity } from '../entities/lesson.entity';
import { LessonsGroupEntity } from '../entities/lessons-group.entity';
import { ILessonManageScopeModel, LessonManageScopeKind } from '../models/lesson-manage-scope.model';
import { IEditLessonModel } from '../models/lessons/edit-lesson.model';
import { ILessonReaderModel } from '../models/lesson-reader.model';
import { LessonVisibility } from '../models/lesson-visibility.enum';

export const LESSON_MANAGE_PERMISSIONS = [
  Permission.MANAGE_LESSONS,
  Permission.MANAGE_OWN_LESSONS,
];

/**
 * Decides which lessons a user sees (reader, see applyVisibility)
 * and what they may create/edit/delete among lessons and lesson groups (scope):
 *
 * - ALL: admin / manage_lessons, no restrictions; any owner, any department.
 * - TEACHER: any teacher profile.
 *   Creates lessons (manage_own_lessons, checked by the route guard) only on their own name,
 *   with no department or their own one. Co-teachers may be from any department.
 *   The owner manages the lesson fully: fields, department, teachers, editors, deletion.
 *   Editors (teacher_lesson.can_edit, granted by the owner) may change the lesson fields only.
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

  async resolveScope(userId: string, permissions: Permission[]): Promise<ILessonManageScopeModel> {
    const teacher = await this.teachersRepository.findOne({ where: { userId, }, });

    if (permissions.includes(Permission.ADMIN) || permissions.includes(Permission.MANAGE_LESSONS)) {
      return { kind: LessonManageScopeKind.ALL, teacher, };
    }
    if (teacher) {
      return { kind: LessonManageScopeKind.TEACHER, teacher, };
    }
    throw new ForbiddenException('Only teachers can manage lessons');
  }

  /** Undefined user: an anonymous reader. */
  async resolveReader(user: IAccessTokenPayload | undefined): Promise<ILessonReaderModel> {
    if (!user) {
      return { isAuthenticated: false, seesAll: false, teacherId: null, departmentId: null, studentGroupId: null, };
    }
    const [teacher, student] = await Promise.all([
      this.teachersRepository.findOne({ where: { userId: user.sub, }, }),
      this.studentsRepository.findOne({ where: { userId: user.sub, }, }),
    ]);
    return {
      isAuthenticated: true,
      seesAll: user.permissions.includes(Permission.ADMIN) || user.permissions.includes(Permission.MANAGE_LESSONS),
      teacherId: teacher?.id ?? null,
      departmentId: teacher?.departmentId ?? null,
      studentGroupId: student?.studentGroupId ?? null,
    };
  }

  readerFromScope(scope: ILessonManageScopeModel): ILessonReaderModel {
    return {
      isAuthenticated: true,
      seesAll: scope.kind === LessonManageScopeKind.ALL,
      teacherId: scope.teacher?.id ?? null,
      departmentId: scope.teacher?.departmentId ?? null,
      studentGroupId: null,
    };
  }

  /**
   * - anonymous: public lessons only;
   * - department-only lessons: members of the lesson's department, the lesson teachers,
   *   students of its groups and admin / manage_lessons;
   * - everything else: any authenticated user.
   */
  applyVisibility(lessonsQb: SelectQueryBuilder<LessonEntity>, reader: ILessonReaderModel): SelectQueryBuilder<LessonEntity> {
    if (reader.seesAll) {
      return lessonsQb;
    }
    if (!reader.isAuthenticated) {
      return lessonsQb.andWhere('ls.visibility = :publicVisibility', { publicVisibility: LessonVisibility.PUBLIC, });
    }
    return lessonsQb.andWhere(new Brackets((visibilityQb) => {
      visibilityQb.where('ls.visibility != :departmentVisibility', { departmentVisibility: LessonVisibility.DEPARTMENT, });
      if (reader.departmentId) {
        visibilityQb.orWhere('ls.departmentId = :readerDepartmentId', { readerDepartmentId: reader.departmentId, });
      }
      if (reader.teacherId) {
        visibilityQb.orWhere(
          'EXISTS (SELECT 1 FROM teacher_lesson vtl WHERE vtl.lesson_id = ls.id AND vtl.teacher_id = :readerTeacherId)',
          { readerTeacherId: reader.teacherId, },
        );
      }
      if (reader.studentGroupId) {
        visibilityQb.orWhere(
          'EXISTS (SELECT 1 FROM student_group_lesson vsgl WHERE vsgl.lesson_id = ls.id AND vsgl.student_group_id = :readerStudentGroupId)',
          { readerStudentGroupId: reader.studentGroupId, },
        );
      }
    }));
  }

  /** Same rule as applyVisibility, for a loaded lesson. Hidden lessons are reported as missing. */
  assertCanSeeLesson(
    reader: ILessonReaderModel,
    lesson: Pick<LessonEntity, 'visibility' | 'departmentId' | 'teacherLessons' | 'studentGroupLessons'>,
  ): void {
    if (!this.canSeeLesson(reader, lesson)) {
      throw new NotFoundException('Lesson not found');
    }
  }

  private canSeeLesson(
    reader: ILessonReaderModel,
    lesson: Pick<LessonEntity, 'visibility' | 'departmentId' | 'teacherLessons' | 'studentGroupLessons'>,
  ): boolean {
    if (reader.seesAll || lesson.visibility === LessonVisibility.PUBLIC) {
      return true;
    }
    if (!reader.isAuthenticated) {
      return false;
    }
    return lesson.visibility !== LessonVisibility.DEPARTMENT
      || (!!reader.departmentId && lesson.departmentId === reader.departmentId)
      || (!!reader.teacherId && lesson.teacherLessons.some((teacherLesson) => teacherLesson.teacherId === reader.teacherId))
      || (!!reader.studentGroupId && lesson.studentGroupLessons.some(
        (studentGroupLesson) => studentGroupLesson.studentGroupId === reader.studentGroupId,
      ));
  }

  /** Owner of a new lesson: the actor themselves, or any teacher for admin / manage_lessons. */
  resolveOwnerId(scope: ILessonManageScopeModel, ownerTeacherId: string | undefined): string {
    if (scope.kind === LessonManageScopeKind.ALL) {
      const ownerId = ownerTeacherId ?? scope.teacher?.id;
      if (!ownerId) {
        throw new BadRequestException('ownerTeacherId is required');
      }
      return ownerId;
    }
    const me = scope.teacher!;
    if (ownerTeacherId && ownerTeacherId !== me.id) {
      throw new ForbiddenException('You can only create lessons on your own name');
    }
    return me.id;
  }

  /**
   * Department of a lesson: none, or an existing department.
   * Non-admins may set only the department they are a member of.
   */
  async assertCanSetDepartment(scope: ILessonManageScopeModel, departmentId: string | null | undefined): Promise<void> {
    if (!departmentId) {
      return;
    }
    if (scope.kind !== LessonManageScopeKind.ALL && scope.teacher!.departmentId !== departmentId) {
      throw new ForbiddenException('You can only set your own department for the lesson');
    }
    await this.departmentsRepository.findOneOrFail({ where: { id: departmentId, }, });
  }

  /** Owner: anything but transferring ownership. Editors: lesson fields only, not its teachers or department. */
  assertCanEditLesson(scope: ILessonManageScopeModel, lesson: Pick<LessonEntity, 'teacherLessons'>, data: IEditLessonModel): void {
    if (scope.kind === LessonManageScopeKind.ALL) {
      return;
    }
    const me = scope.teacher!;
    const myTeacherLesson = lesson.teacherLessons.find((teacherLesson) => teacherLesson.teacherId === me.id);

    if (myTeacherLesson?.isOwner) {
      if (data.ownerTeacherId !== undefined && data.ownerTeacherId !== me.id) {
        throw new ForbiddenException('Only admin can transfer the lesson to another owner');
      }
      return;
    }
    if (myTeacherLesson?.canEdit) {
      const ownerOnlyFields = [data.ownerTeacherId, data.teacherIds, data.editorTeacherIds, data.departmentId];
      if (ownerOnlyFields.some((value) => value !== undefined)) {
        throw new ForbiddenException('Only the lesson owner can change its teachers and department');
      }
      return;
    }
    throw new ForbiddenException('You do not have access to edit this lesson');
  }

  /** Deleting a lesson or generating a series from it. */
  assertIsLessonOwner(scope: ILessonManageScopeModel, lesson: Pick<LessonEntity, 'teacherLessons'>): void {
    if (scope.kind === LessonManageScopeKind.ALL) {
      return;
    }
    const isOwner = lesson.teacherLessons.some(
      (teacherLesson) => teacherLesson.isOwner && teacherLesson.teacherId === scope.teacher!.id,
    );
    if (!isOwner) {
      throw new ForbiddenException('Only the lesson owner can do this');
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
    if (scope.kind === LessonManageScopeKind.ALL) {
      return true;
    }
    return group.createdByTeacherId === scope.teacher!.id;
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
}
