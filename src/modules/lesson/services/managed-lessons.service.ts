import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LessonEntity } from '../entities/lesson.entity';
import { LessonsGroupEntity } from '../entities/lessons-group.entity';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';
import { ICreateLessonModel } from '../models/lessons/create-lesson.model';
import { IEditLessonModel } from '../models/lessons/edit-lesson.model';
import { ILessonManageScopeModel } from '../models/lesson-manage-scope.model';
import { ILessonReaderModel } from '../models/lesson-reader.model';
import { IGetLessonsFiltersModel } from '../models/lessons/get-lessons-filter.model';
import { ILessonListItemModel } from '../models/lessons/lesson-list-item.model';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { LessonsService } from './lessons.service';
import { LessonAccessService } from './lesson-access.service';

/**
 * Lessons as the current user may see and manage them (see LessonAccessService):
 * reading within the reader's visibility, creating / editing / deleting within the lesson scope.
 */
@Injectable()
export class ManagedLessonsService {
  constructor(
    @InjectRepository(LessonEntity)
    private lessonsRepository: Repository<LessonEntity>,
    @InjectRepository(LessonsGroupEntity)
    private lessonGroupsRepository: Repository<LessonsGroupEntity>,
    private readonly lessonsService: LessonsService,
    private readonly lessonAccessService: LessonAccessService,
  ) {}

  async getLessons(filters: IGetLessonsFiltersModel, reader: ILessonReaderModel): Promise<IGenericListPayloadResponse<ILessonListItemModel>> {
    const lessonsQb = this.lessonAccessService.applyVisibility(this.lessonsService.buildLessonsQuery(filters), reader);
    return await this.lessonsService.getPage(lessonsQb, filters);
  }

  async createLesson(data: ICreateLessonModel, scope: ILessonManageScopeModel): Promise<ILessonItemModel> {
    const ownerTeacherId = this.lessonAccessService.resolveOwnerId(scope, data.ownerTeacherId);
    await this.lessonAccessService.assertCanSetDepartment(scope, data.departmentId);
    if (data.lessonGroupId) {
      await this.assertCanUseGroup(scope, data.lessonGroupId);
    }
    return await this.lessonsService.createLesson({ ...data, ownerTeacherId, });
  }

  async editLesson(lesson: LessonEntity, data: IEditLessonModel, scope: ILessonManageScopeModel): Promise<ILessonItemModel> {
    this.lessonAccessService.assertCanEditLesson(scope, lesson, data);
    if (data.departmentId !== undefined && data.departmentId !== lesson.departmentId) {
      await this.lessonAccessService.assertCanSetDepartment(scope, data.departmentId);
    }
    if (data.lessonGroupId && data.lessonGroupId !== lesson.lessonGroupId) {
      await this.assertCanUseGroup(scope, data.lessonGroupId);
    }
    return await this.lessonsService.editLesson(lesson.id, data);
  }

  /** A lesson hidden from the reader (department-only) is reported as missing. */
  async getVisibleLessonOrFail(lessonId: string, reader: ILessonReaderModel): Promise<LessonEntity> {
    const lesson = await this.findLesson(lessonId);
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
    this.lessonAccessService.assertCanSeeLesson(reader, lesson);
    return lesson;
  }

  /** A lesson to edit / delete: hidden ones are missing, not forbidden. */
  async getManagedLessonOrFail(lessonId: string, scope: ILessonManageScopeModel): Promise<LessonEntity> {
    return await this.getVisibleLessonOrFail(lessonId, this.lessonAccessService.readerFromScope(scope));
  }

  async getVisibleLesson(lessonId: string, reader: ILessonReaderModel): Promise<ILessonItemModel> {
    const lesson = await this.getVisibleLessonOrFail(lessonId, reader);
    return await this.lessonsService.getById(lesson.id);
  }

  async deleteLesson(lesson: LessonEntity, scope: ILessonManageScopeModel): Promise<void> {
    this.lessonAccessService.assertIsLessonOwner(scope, lesson);
    await this.lessonsRepository.remove(lesson);
  }

  /** With its teachers and student groups, for the access checks. */
  async findLesson(lessonId: string): Promise<LessonEntity | null> {
    return await this.lessonsRepository.findOne({
      where: { id: lessonId, },
      relations: { teacherLessons: true, studentGroupLessons: true, },
    });
  }

  private async assertCanUseGroup(scope: ILessonManageScopeModel, lessonGroupId: string): Promise<void> {
    const lessonGroup = await this.lessonGroupsRepository.findOneOrFail({
      where: { id: lessonGroupId, },
    });
    this.lessonAccessService.assertCanUseGroup(scope, lessonGroup);
  }
}
