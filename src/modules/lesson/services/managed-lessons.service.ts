import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LessonEntity } from '../entities/lesson.entity';
import { LessonsGroupEntity } from '../entities/lessons-group.entity';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';
import { ICreateLessonModel } from '../models/lessons/create-lesson.model';
import { IEditLessonModel } from '../models/lessons/edit-lesson.model';
import { ILessonActorModel } from '../models/lesson-actor.model';
import { IGetLessonsFiltersModel } from '../models/lessons/get-lessons-filter.model';
import { ILessonListItemModel } from '../models/lessons/lesson-list-item.model';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { LessonsService } from './lessons.service';
import { LessonAccessService } from './lesson-access.service';

/** Lessons in the teacher domain: LessonsService behind the rules of LessonAccessService */
@Injectable()
export class ManagedLessonsService {
  constructor(
    @InjectRepository(LessonsGroupEntity)
    private lessonGroupsRepository: Repository<LessonsGroupEntity>,
    private readonly lessonsService: LessonsService,
    private readonly lessonAccessService: LessonAccessService,
  ) {}

  async getLessons(filters: IGetLessonsFiltersModel, actor: ILessonActorModel): Promise<IGenericListPayloadResponse<ILessonListItemModel>> {
    const lessonsQb = this.lessonAccessService.applyVisibility(this.lessonsService.buildLessonsQuery(filters), actor);
    const page = await this.lessonsService.getPage(lessonsQb, filters);
    return { ...page, items: page.items.map((item) => this.withCanEdit(actor, item)), };
  }

  async getLesson(lessonId: string, actor: ILessonActorModel): Promise<ILessonItemModel> {
    await this.getVisibleLessonOrFail(lessonId, actor);
    return this.withCanEdit(actor, await this.lessonsService.getById(lessonId));
  }

  async createLesson(data: ICreateLessonModel, actor: ILessonActorModel): Promise<ILessonItemModel> {
    this.lessonAccessService.assertIsTeacher(actor);
    this.lessonAccessService.assertIsAuthorAmongTeachers(actor, data.teacherIds);
    await this.lessonAccessService.assertCanAddLessonDepartments(data.departmentIds ?? [], data.teacherIds);
    if (data.lessonGroupId) {
      await this.assertCanUseGroup(actor, data.lessonGroupId);
    }
    return this.withCanEdit(actor, await this.lessonsService.createLesson(data));
  }

  async editLesson(lessonId: string, data: IEditLessonModel, actor: ILessonActorModel): Promise<ILessonItemModel> {
    const lesson = await this.getEditableLessonOrFail(lessonId, actor);
    if (data.departmentIds) {
      const current = this.lessonAccessService.toAccessTarget(lesson);
      await this.lessonAccessService.assertCanAddLessonDepartments(
        data.departmentIds.filter((departmentId) => !current.departmentIds.includes(departmentId)),
        data.teacherIds ?? current.teacherIds,
      );
    }
    if (data.lessonGroupId && data.lessonGroupId !== lesson.lessonGroupId) {
      await this.assertCanUseGroup(actor, data.lessonGroupId);
    }
    return this.withCanEdit(actor, await this.lessonsService.editLesson(lessonId, data));
  }

  async deleteLesson(lessonId: string, actor: ILessonActorModel): Promise<void> {
    await this.getEditableLessonOrFail(lessonId, actor);
    await this.lessonsService.deleteLesson(lessonId);
  }

  /** 404 when the actor may not see the lesson, 403 when they see it but may not edit it */
  async getEditableLessonOrFail(lessonId: string, actor: ILessonActorModel): Promise<LessonEntity> {
    const lesson = await this.getVisibleLessonOrFail(lessonId, actor);
    this.lessonAccessService.assertCanEdit(actor, this.lessonAccessService.toAccessTarget(lesson));
    return lesson;
  }

  withCanEdit<T extends ILessonItemModel>(actor: ILessonActorModel, item: T): T {
    return { ...item, canEdit: this.lessonAccessService.canEdit(actor, item), };
  }

  private async getVisibleLessonOrFail(lessonId: string, actor: ILessonActorModel): Promise<LessonEntity> {
    const lesson = await this.lessonsService.findWithRelations(lessonId);
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
    this.lessonAccessService.assertCanSee(actor, this.lessonAccessService.toAccessTarget(lesson));
    return lesson;
  }

  private async assertCanUseGroup(actor: ILessonActorModel, lessonGroupId: string): Promise<void> {
    const lessonGroup = await this.lessonGroupsRepository.findOneOrFail({
      where: { id: lessonGroupId, },
    });
    this.lessonAccessService.assertCanUseGroup(actor, lessonGroup);
  }
}
