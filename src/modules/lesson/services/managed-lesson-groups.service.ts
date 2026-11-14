import { BadRequestException, Injectable } from '@nestjs/common';
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
import { IAddLessonsToGroupModel, ICreateLessonGroupWithLessonsModel } from '../models/lesson-groups/create-lesson-group-with-lessons.model';
import { ILessonGroupWithLessonsModel } from '../models/lesson-groups/lesson-group-with-lessons.model';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';
import { ILessonActorModel } from '../models/lesson-actor.model';
import { LessonsGroupsService } from './lessons-groups.service';
import { LessonAccessService } from './lesson-access.service';
import { LessonGroupsMapper } from '../mappers/lesson-groups.mapper';
import { ILessonGroupDictionaryItem } from '../models/lesson-groups/lesson-group-dictionary-item.model';
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
    private readonly lessonGroupsMapper: LessonGroupsMapper,
  ) {}

  async getAll(params: IGetLessonGroupsFiltersModel): Promise<IGenericListPayloadResponse<ILessonGroupListItemModel>> {
    return await this.lessonsGroupsService.getAll(params);
  }

  /** The actor's own groups (they created them), for selects */
  async getOwn(actor: ILessonActorModel): Promise<ILessonGroupDictionaryItem[]> {
    if (!actor.teacherId) {
      return [];
    }
    const groups = await this.lessonGroupsRepository.find({
      where: { createdByTeacherId: actor.teacherId, },
      select: ['id', 'name',],
      order: { name: 'ASC', },
    });
    return groups.map((group) => this.lessonGroupsMapper.entityToDictionaryItem(group));
  }

  /** Same rules as creating each lesson, plus the actor may use the group */
  async addLessonsToGroup(lessonGroupId: string, data: IAddLessonsToGroupModel, actor: ILessonActorModel): Promise<ILessonItemModel[]> {
    this.lessonAccessService.assertIsTeacher(actor);
    this.lessonAccessService.assertCanUseGroup(actor, await this.findGroup(lessonGroupId));
    this.lessonAccessService.assertIsAuthorAmongTeachers(actor, data.lesson.teacherIds);
    await this.lessonAccessService.assertCanAddLessonDepartments(data.lesson.departmentIds ?? [], data.lesson.teacherIds);
    const lessons = await this.lessonsGroupsService.addLessonsToGroup(lessonGroupId, data);
    return lessons.map((lesson) => this.managedLessonsService.withCanEdit(actor, lesson));
  }

  /** Groups the actor may put lessons into, for selects */
  async getUsable(actor: ILessonActorModel): Promise<ILessonGroupDictionaryItem[]> {
    const groupsQb = this.lessonGroupsRepository
      .createQueryBuilder('lsgroups')
      .select(['lsgroups.id', 'lsgroups.name',])
      .orderBy('lsgroups.name', 'ASC');
    const groups = await this.lessonAccessService.applyUsableGroups(groupsQb, 'lsgroups', actor).getMany();
    return groups.map((group) => this.lessonGroupsMapper.entityToDictionaryItem(group));
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
    if (!baseLesson.lessonGroupId) {
      throw new BadRequestException('Put the lesson into a group before repeating it');
    }
    this.lessonAccessService.assertCanUseGroup(actor, await this.findGroup(baseLesson.lessonGroupId));
    return await this.lessonsGroupsService.generateLessonSeries(data);
  }

  async createLessonGroupWithLessons(data: ICreateLessonGroupWithLessonsModel, actor: ILessonActorModel): Promise<ILessonGroupWithLessonsModel> {
    this.lessonAccessService.assertIsTeacher(actor);
    this.lessonAccessService.assertIsAuthorAmongTeachers(actor, data.lesson.teacherIds);
    await this.lessonAccessService.assertCanAddLessonDepartments(data.lesson.departmentIds ?? [], data.lesson.teacherIds);
    return await this.lessonsGroupsService.createLessonGroupWithLessons(data, {
      createdByTeacherId: actor.teacherId,
      departmentId: null,
    });
  }

  private async findGroup(lessonGroupId: string): Promise<LessonsGroupEntity> {
    return await this.lessonGroupsRepository.findOneOrFail({
      where: { id: lessonGroupId, },
    });
  }
}
