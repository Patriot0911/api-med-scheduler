import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LessonsGroupEntity } from '../entities/lessons-group.entity';
import { Permission } from 'src/shared/models/permission.enum';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { IGetLessonGroupsFiltersModel } from '../models/lesson-groups/get-lesson-groups-filter.model';
import { ILessonGroupListItemModel } from '../models/lesson-groups/lesson-group-list-item.model';
import { ILessonGroupItemModel } from '../models/lesson-groups/lesson-group-item.model';
import { ICreateLessonGroupModel } from '../models/lesson-groups/create-lesson-group.model';
import { IEditLessonGroupModel } from '../models/lesson-groups/edit-lesson-group.model';
import { IGenerateLessonSeriesModel } from '../models/lesson-groups/generate-lesson-series.model';
import { ICreateLessonGroupWithLessonsModel } from '../models/lesson-groups/create-lesson-group-with-lessons.model';
import { ILessonGroupWithLessonsModel } from '../models/lesson-groups/lesson-group-with-lessons.model';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';
import { ILessonManageScopeModel } from '../models/lesson-manage-scope.model';
import { LessonsGroupsService, TLessonGroupOwnership } from './lessons-groups.service';
import { DepartmentLessonsService } from './department-lessons.service';
import { LessonAccessService } from './lesson-access.service';

/**
 * Lesson groups within a department (lessons_group.department_id).
 * Reading: members of the department and admin / manage_lessons.
 * Managing: the lesson scope; non-admins only within their own department.
 */
@Injectable()
export class DepartmentLessonGroupsService {
  constructor(
    @InjectRepository(LessonsGroupEntity)
    private lessonGroupsRepository: Repository<LessonsGroupEntity>,
    private readonly lessonsGroupsService: LessonsGroupsService,
    private readonly departmentLessonsService: DepartmentLessonsService,
    private readonly lessonAccessService: LessonAccessService,
  ) {}

  async getAll(
    departmentId: string,
    params: IGetLessonGroupsFiltersModel,
    userId: string,
    permissions: Permission[],
  ): Promise<IGenericListPayloadResponse<ILessonGroupListItemModel>> {
    await this.departmentLessonsService.resolveReader(departmentId, userId, permissions);
    return await this.lessonsGroupsService.getAll(params, departmentId);
  }

  async getById(departmentId: string, lessonGroupId: string, userId: string, permissions: Permission[]): Promise<ILessonGroupItemModel> {
    await this.departmentLessonsService.resolveReader(departmentId, userId, permissions);
    await this.findDepartmentGroup(departmentId, lessonGroupId);
    return await this.lessonsGroupsService.getById(lessonGroupId);
  }

  async createLessonGroup(departmentId: string, data: ICreateLessonGroupModel, scope: ILessonManageScopeModel): Promise<ILessonGroupItemModel> {
    await this.departmentLessonsService.assertCanManageInDepartment(departmentId, scope);
    return await this.lessonsGroupsService.createLessonGroup(data, this.ownership(departmentId, scope));
  }

  async editLessonGroup(
    departmentId: string,
    lessonGroupId: string,
    data: IEditLessonGroupModel,
    scope: ILessonManageScopeModel,
  ): Promise<boolean> {
    await this.departmentLessonsService.assertCanManageInDepartment(departmentId, scope);
    const lessonGroup = await this.findDepartmentGroup(departmentId, lessonGroupId);
    this.lessonAccessService.assertCanManageGroup(scope, lessonGroup);
    return await this.lessonsGroupsService.editLessonGroup(data, lessonGroupId);
  }

  async deleteLessonGroup(departmentId: string, lessonGroupId: string, scope: ILessonManageScopeModel): Promise<ILessonGroupItemModel> {
    await this.departmentLessonsService.assertCanManageInDepartment(departmentId, scope);
    const lessonGroup = await this.findDepartmentGroup(departmentId, lessonGroupId);
    this.lessonAccessService.assertCanManageGroup(scope, lessonGroup);
    return await this.lessonsGroupsService.deleteLessonGroup(lessonGroupId);
  }

  async assignLessonToGroup(
    departmentId: string,
    lessonGroupId: string,
    lessonId: string,
    scope: ILessonManageScopeModel,
  ): Promise<boolean> {
    await this.departmentLessonsService.assertCanManageInDepartment(departmentId, scope);
    const lessonGroup = await this.findDepartmentGroup(departmentId, lessonGroupId);
    this.lessonAccessService.assertCanUseGroup(scope, lessonGroup);
    const lesson = await this.departmentLessonsService.findDepartmentLesson(departmentId, lessonId);
    await this.lessonAccessService.assertCanManageLesson(scope, lesson);
    return await this.lessonsGroupsService.assignLessonToGroup(lessonGroupId, lessonId);
  }

  async generateLessonSeries(departmentId: string, data: IGenerateLessonSeriesModel, scope: ILessonManageScopeModel): Promise<ILessonItemModel[]> {
    await this.departmentLessonsService.assertCanManageInDepartment(departmentId, scope);
    const baseLesson = await this.departmentLessonsService.findDepartmentLesson(departmentId, data.baseLessonId);
    await this.lessonAccessService.assertCanManageLesson(scope, baseLesson);
    const lessonGroup = await this.lessonGroupsRepository.findOneOrFail({
      where: { id: baseLesson.lessonGroupId, },
    });
    this.lessonAccessService.assertCanUseGroup(scope, lessonGroup);
    return await this.lessonsGroupsService.generateLessonSeries(data);
  }

  async createLessonGroupWithLessons(
    departmentId: string,
    data: ICreateLessonGroupWithLessonsModel,
    scope: ILessonManageScopeModel,
  ): Promise<ILessonGroupWithLessonsModel> {
    await this.departmentLessonsService.assertCanManageInDepartment(departmentId, scope);
    await this.lessonAccessService.assertCanAssignTeachers(scope, data.teacherIds);
    await this.departmentLessonsService.assertTeachersKeepLessonInDepartment(departmentId, data.teacherIds);
    return await this.lessonsGroupsService.createLessonGroupWithLessons(data, this.ownership(departmentId, scope));
  }

  private async findDepartmentGroup(departmentId: string, lessonGroupId: string): Promise<LessonsGroupEntity> {
    const lessonGroup = await this.lessonGroupsRepository.findOne({
      where: { id: lessonGroupId, departmentId, },
    });
    if (!lessonGroup) {
      throw new NotFoundException('Lesson group not found in this department');
    }
    return lessonGroup;
  }

  private ownership(departmentId: string, scope: ILessonManageScopeModel): TLessonGroupOwnership {
    return {
      createdByTeacherId: scope.teacher?.id ?? null,
      departmentId,
    };
  }
}
