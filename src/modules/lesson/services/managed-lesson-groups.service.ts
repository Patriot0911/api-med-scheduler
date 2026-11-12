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
import { ILessonActorModel } from '../models/lesson-actor.model';
import { LessonsGroupsService } from './lessons-groups.service';
import { LessonAccessService } from './lesson-access.service';
import { ManagedLessonsService } from './managed-lessons.service';

/** Lesson groups in the teacher domain: LessonsGroupsService behind the rules of LessonAccessService */
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

  async createLessonGroup(data: ICreateLessonGroupModel, actor: ILessonActorModel): Promise<ILessonGroupItemModel> {
    this.lessonAccessService.assertIsTeacher(actor);
    await this.lessonAccessService.assertCanSetDepartment(actor, data.departmentId);
    return await this.lessonsGroupsService.createLessonGroup(data, {
      createdByTeacherId: actor.teacherId,
      departmentId: data.departmentId ?? null,
    });
  }

  async editLessonGroup(lessonGroupId: string, data: IEditLessonGroupModel, actor: ILessonActorModel): Promise<boolean> {
    this.lessonAccessService.assertCanManageGroup(actor, await this.findGroup(lessonGroupId));
    return await this.lessonsGroupsService.editLessonGroup(data, lessonGroupId);
  }

  async deleteLessonGroup(lessonGroupId: string, actor: ILessonActorModel): Promise<ILessonGroupItemModel> {
    this.lessonAccessService.assertCanManageGroup(actor, await this.findGroup(lessonGroupId));
    return await this.lessonsGroupsService.deleteLessonGroup(lessonGroupId);
  }

  async assignLessonToGroup(lessonGroupId: string, lessonId: string, actor: ILessonActorModel): Promise<boolean> {
    this.lessonAccessService.assertCanUseGroup(actor, await this.findGroup(lessonGroupId));
    await this.managedLessonsService.getEditableLessonOrFail(lessonId, actor);
    return await this.lessonsGroupsService.assignLessonToGroup(lessonGroupId, lessonId);
  }

  async generateLessonSeries(data: IGenerateLessonSeriesModel, actor: ILessonActorModel): Promise<ILessonItemModel[]> {
    const baseLesson = await this.managedLessonsService.getEditableLessonOrFail(data.baseLessonId, actor);
    this.lessonAccessService.assertCanUseGroup(actor, await this.findGroup(baseLesson.lessonGroupId));
    return await this.lessonsGroupsService.generateLessonSeries(data);
  }

  async createLessonGroupWithLessons(data: ICreateLessonGroupWithLessonsModel, actor: ILessonActorModel): Promise<ILessonGroupWithLessonsModel> {
    this.lessonAccessService.assertIsTeacher(actor);
    await this.lessonAccessService.assertCanSetDepartment(actor, data.departmentId);
    this.lessonAccessService.assertCanEdit(actor, { departmentId: data.departmentId ?? null, teacherIds: data.teacherIds, });
    return await this.lessonsGroupsService.createLessonGroupWithLessons(data, {
      createdByTeacherId: actor.teacherId,
      departmentId: data.departmentId ?? null,
    });
  }

  private async findGroup(lessonGroupId: string): Promise<LessonsGroupEntity> {
    return await this.lessonGroupsRepository.findOneOrFail({
      where: { id: lessonGroupId, },
    });
  }
}
