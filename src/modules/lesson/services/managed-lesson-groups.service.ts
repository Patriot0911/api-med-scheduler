import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LessonsGroupEntity } from '../entities/lessons-group.entity';
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
import { LessonAccessService } from './lesson-access.service';
import { ManagedLessonsService } from './managed-lessons.service';

/**
 * Lesson groups as the current user may manage them (see LessonAccessService).
 * Reading: any authenticated user. Creating: in no department or (non-admins) their own one.
 * Editing / deleting: the creator or admin / manage_lessons.
 */
@Injectable()
export class ManagedLessonGroupsService {
  constructor(
    @InjectRepository(LessonsGroupEntity)
    private lessonGroupsRepository: Repository<LessonsGroupEntity>,
    private readonly lessonsGroupsService: LessonsGroupsService,
    private readonly managedLessonsService: ManagedLessonsService,
    private readonly lessonAccessService: LessonAccessService,
  ) {}

  async getAll(params: IGetLessonGroupsFiltersModel): Promise<IGenericListPayloadResponse<ILessonGroupListItemModel>> {
    return await this.lessonsGroupsService.getAll(params);
  }

  async getById(lessonGroupId: string): Promise<ILessonGroupItemModel> {
    return await this.lessonsGroupsService.getById(lessonGroupId);
  }

  async createLessonGroup(data: ICreateLessonGroupModel, scope: ILessonManageScopeModel): Promise<ILessonGroupItemModel> {
    await this.lessonAccessService.assertCanSetDepartment(scope, data.departmentId);
    return await this.lessonsGroupsService.createLessonGroup(data, this.ownership(data.departmentId, scope));
  }

  async editLessonGroup(lessonGroupId: string, data: IEditLessonGroupModel, scope: ILessonManageScopeModel): Promise<boolean> {
    const lessonGroup = await this.findGroup(lessonGroupId);
    this.lessonAccessService.assertCanManageGroup(scope, lessonGroup);
    return await this.lessonsGroupsService.editLessonGroup(data, lessonGroupId);
  }

  async deleteLessonGroup(lessonGroupId: string, scope: ILessonManageScopeModel): Promise<ILessonGroupItemModel> {
    const lessonGroup = await this.findGroup(lessonGroupId);
    this.lessonAccessService.assertCanManageGroup(scope, lessonGroup);
    return await this.lessonsGroupsService.deleteLessonGroup(lessonGroupId);
  }

  async assignLessonToGroup(lessonGroupId: string, lessonId: string, scope: ILessonManageScopeModel): Promise<boolean> {
    const lessonGroup = await this.findGroup(lessonGroupId);
    this.lessonAccessService.assertCanUseGroup(scope, lessonGroup);
    const lesson = await this.managedLessonsService.getManagedLessonOrFail(lessonId, scope);
    this.lessonAccessService.assertCanEditLesson(scope, lesson, { lessonGroupId, });
    return await this.lessonsGroupsService.assignLessonToGroup(lessonGroupId, lessonId);
  }

  /** The series is owned by the base lesson's owner, so only they (or admin) may generate it. */
  async generateLessonSeries(data: IGenerateLessonSeriesModel, scope: ILessonManageScopeModel): Promise<ILessonItemModel[]> {
    const baseLesson = await this.managedLessonsService.getManagedLessonOrFail(data.baseLessonId, scope);
    this.lessonAccessService.assertIsLessonOwner(scope, baseLesson);
    const lessonGroup = await this.findGroup(baseLesson.lessonGroupId);
    this.lessonAccessService.assertCanUseGroup(scope, lessonGroup);
    return await this.lessonsGroupsService.generateLessonSeries(data);
  }

  async createLessonGroupWithLessons(
    data: ICreateLessonGroupWithLessonsModel,
    scope: ILessonManageScopeModel,
  ): Promise<ILessonGroupWithLessonsModel> {
    const ownerTeacherId = this.lessonAccessService.resolveOwnerId(scope, data.ownerTeacherId);
    await this.lessonAccessService.assertCanSetDepartment(scope, data.departmentId);
    return await this.lessonsGroupsService.createLessonGroupWithLessons(
      { ...data, ownerTeacherId, },
      this.ownership(data.departmentId, scope),
    );
  }

  private async findGroup(lessonGroupId: string): Promise<LessonsGroupEntity> {
    return await this.lessonGroupsRepository.findOneOrFail({
      where: { id: lessonGroupId, },
    });
  }

  private ownership(departmentId: string | null | undefined, scope: ILessonManageScopeModel): TLessonGroupOwnership {
    return {
      createdByTeacherId: scope.teacher?.id ?? null,
      departmentId: departmentId ?? null,
    };
  }
}
