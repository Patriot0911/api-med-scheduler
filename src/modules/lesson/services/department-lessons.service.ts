import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository, SelectQueryBuilder } from 'typeorm';
import { LessonEntity } from '../entities/lesson.entity';
import { LessonsGroupEntity } from '../entities/lessons-group.entity';
import { TeacherEntity } from 'src/modules/users/entities/teacher.entity';
import { DepartmentEntity } from 'src/modules/departments/entities/department.entity';
import { Permission } from 'src/shared/models/permission.enum';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { LessonVisibility } from '../models/lesson-visibility.enum';
import { IGetLessonsFiltersModel } from '../models/lessons/get-lessons-filter.model';
import { ILessonListItemModel } from '../models/lessons/lesson-list-item.model';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';
import { ICreateLessonModel } from '../models/lessons/create-lesson.model';
import { IEditLessonModel } from '../models/lessons/edit-lesson.model';
import { ILessonManageScopeModel, LessonManageScopeKind } from '../models/lesson-manage-scope.model';
import { LessonsService } from './lessons.service';
import { LessonAccessService } from './lesson-access.service';

/**
 * Lessons within a department: a lesson belongs to a department
 * when at least one of its teachers is a member of that department.
 *
 * Reading: members of the department and admin / manage_lessons.
 *   Regular members see public / teachers / department lessons and the ones they teach;
 *   the configured head and admin / manage_lessons see all of them.
 * Managing: the lesson scope (own / department / all); non-admins only within their own department.
 */
@Injectable()
export class DepartmentLessonsService {
  constructor(
    @InjectRepository(LessonEntity)
    private lessonsRepository: Repository<LessonEntity>,
    @InjectRepository(LessonsGroupEntity)
    private lessonGroupsRepository: Repository<LessonsGroupEntity>,
    @InjectRepository(TeacherEntity)
    private teachersRepository: Repository<TeacherEntity>,
    @InjectRepository(DepartmentEntity)
    private departmentsRepository: Repository<DepartmentEntity>,
    private readonly lessonsService: LessonsService,
    private readonly lessonAccessService: LessonAccessService,
  ) {}

  async getLessons(
    departmentId: string,
    params: IGetLessonsFiltersModel,
    userId: string,
    permissions: Permission[],
  ): Promise<IGenericListPayloadResponse<ILessonListItemModel>> {
    const lessonsQb = await this.buildReadableQuery(departmentId, userId, permissions, this.lessonsService.buildLessonsQuery(params));
    return await this.lessonsService.getPage(lessonsQb, params);
  }

  async getLesson(departmentId: string, lessonId: string, userId: string, permissions: Permission[]): Promise<ILessonItemModel> {
    const lessonsQb = await this.buildReadableQuery(departmentId, userId, permissions, this.lessonsService.buildLessonsQuery({}));
    const lesson = await lessonsQb
      .andWhere('ls.id = :lessonId', { lessonId, })
      .getOne();
    if (!lesson) {
      throw new NotFoundException('Lesson not found in this department');
    }
    return await this.lessonsService.getById(lesson.id);
  }

  async createLesson(departmentId: string, data: ICreateLessonModel, scope: ILessonManageScopeModel): Promise<ILessonItemModel> {
    await this.assertCanManageInDepartment(departmentId, scope);
    await this.lessonAccessService.assertCanAssignTeachers(scope, data.teacherIds);
    await this.assertTeachersKeepLessonInDepartment(departmentId, data.teacherIds);
    if (data.lessonGroupId) {
      const lessonGroup = await this.lessonGroupsRepository.findOneOrFail({
        where: { id: data.lessonGroupId, },
      });
      this.lessonAccessService.assertCanUseGroup(scope, lessonGroup);
    }
    return await this.lessonsService.createLesson(data);
  }

  async editLesson(departmentId: string, lessonId: string, data: IEditLessonModel, scope: ILessonManageScopeModel): Promise<ILessonItemModel> {
    await this.assertCanManageInDepartment(departmentId, scope);
    const lesson = await this.findDepartmentLesson(departmentId, lessonId);
    await this.lessonAccessService.assertCanManageLesson(scope, lesson);
    if (data.teacherIds !== undefined) {
      await this.lessonAccessService.assertCanAssignTeachers(scope, data.teacherIds);
      await this.assertTeachersKeepLessonInDepartment(departmentId, data.teacherIds);
    }
    if (data.lessonGroupId && data.lessonGroupId !== lesson.lessonGroupId) {
      const lessonGroup = await this.lessonGroupsRepository.findOneOrFail({
        where: { id: data.lessonGroupId, },
      });
      this.lessonAccessService.assertCanUseGroup(scope, lessonGroup);
    }
    return await this.lessonsService.editLesson(lessonId, data);
  }

  async deleteLesson(departmentId: string, lessonId: string, scope: ILessonManageScopeModel): Promise<void> {
    await this.assertCanManageInDepartment(departmentId, scope);
    const lesson = await this.findDepartmentLesson(departmentId, lessonId);
    await this.lessonAccessService.assertCanManageLesson(scope, lesson);
    await this.lessonsRepository.remove(lesson);
  }

  /**
   * Checks read access to the department: members and admin / manage_lessons.
   * Returns the teacher whose visibility limits apply, or null when the user sees everything
   * (admin / manage_lessons / the configured head).
   */
  async resolveReader(departmentId: string, userId: string, permissions: Permission[]): Promise<TeacherEntity | null> {
    await this.departmentsRepository.findOneOrFail({ where: { id: departmentId, }, });

    if (permissions.includes(Permission.ADMIN) || permissions.includes(Permission.MANAGE_LESSONS)) {
      return null;
    }

    const teacherProfile = await this.teachersRepository.findOne({ where: { userId, }, });
    if (!teacherProfile || teacherProfile.departmentId !== departmentId) {
      throw new ForbiddenException('You are not a member of this department');
    }

    const headDepartmentId = await this.lessonAccessService.getHeadedDepartmentId(teacherProfile, permissions);
    return headDepartmentId === departmentId ? null : teacherProfile;
  }

  /** Restricts the query to the department's lessons visible to the user. */
  private async buildReadableQuery(
    departmentId: string,
    userId: string,
    permissions: Permission[],
    lessonsQb: SelectQueryBuilder<LessonEntity>,
  ): Promise<SelectQueryBuilder<LessonEntity>> {
    const restrictedTeacher = await this.resolveReader(departmentId, userId, permissions);

    lessonsQb.andWhere(
      `EXISTS (
        SELECT 1 FROM teacher_lesson dtl
        INNER JOIN teachers dt ON dt.id = dtl.teacher_id
        WHERE dtl.lesson_id = ls.id AND dt.department_id = :departmentId
      )`,
      { departmentId, },
    );

    if (!restrictedTeacher) {
      return lessonsQb;
    }

    return lessonsQb.andWhere(new Brackets((visibilityQb) => {
      visibilityQb
        .where('ls.visibility IN (:...departmentVisibilities)', {
          departmentVisibilities: [LessonVisibility.PUBLIC, LessonVisibility.TEACHERS, LessonVisibility.DEPARTMENT],
        })
        .orWhere(
          'EXISTS (SELECT 1 FROM teacher_lesson mtl WHERE mtl.lesson_id = ls.id AND mtl.teacher_id = :myTeacherId)',
          { myTeacherId: restrictedTeacher.id, },
        );
    }));
  }

  async assertCanManageInDepartment(departmentId: string, scope: ILessonManageScopeModel): Promise<void> {
    await this.departmentsRepository.findOneOrFail({ where: { id: departmentId, }, });
    if (scope.kind !== LessonManageScopeKind.ALL && scope.teacher?.departmentId !== departmentId) {
      throw new ForbiddenException('You can only manage lessons of your own department');
    }
  }

  async findDepartmentLesson(departmentId: string, lessonId: string): Promise<LessonEntity> {
    const lesson = await this.lessonsRepository.findOne({
      where: { id: lessonId, },
      relations: { teacherLessons: true, },
    });
    const teacherIds = lesson?.teacherLessons.map((teacherLesson) => teacherLesson.teacherId) ?? [];
    if (!lesson || !(await this.hasDepartmentTeacher(departmentId, teacherIds))) {
      throw new NotFoundException('Lesson not found in this department');
    }
    return lesson;
  }

  /** A department lesson must keep at least one teacher of the department (relevant for admin / manage_lessons). */
  async assertTeachersKeepLessonInDepartment(departmentId: string, teacherIds: string[] | undefined): Promise<void> {
    if (!(await this.hasDepartmentTeacher(departmentId, teacherIds ?? []))) {
      throw new BadRequestException('At least one teacher of this department must be assigned to the lesson');
    }
  }

  private async hasDepartmentTeacher(departmentId: string, teacherIds: string[]): Promise<boolean> {
    if (teacherIds.length === 0) {
      return false;
    }
    return await this.teachersRepository.exists({
      where: { id: In(teacherIds), departmentId, },
    });
  }
}
