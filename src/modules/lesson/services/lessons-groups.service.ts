import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessonsGroupEntity } from '../entities/lessons-group.entity';
import { Repository } from 'typeorm';
import { IGetLessonGroupsFiltersModel } from '../models/lesson-groups/get-lesson-groups-filter.model';
import { LessonGroupsMapper } from '../mappers/lesson-groups.mapper';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { ILessonGroupListItemModel } from '../models/lesson-groups/lesson-group-list-item.model';
import { ILessonGroupItemModel } from '../models/lesson-groups/lesson-group-item.model';
import { ICreateLessonGroupModel } from '../models/lesson-groups/create-lesson-group.model';
import { IEditLessonGroupModel } from '../models/lesson-groups/edit-lesson-group.model';
import { ILessonGroupDictionaryItem } from '../models/lesson-groups/lesson-group-dictionary-item.model';
import { LessonEntity } from '../entities/lesson.entity';
import { LessonsService } from './lessons.service';
import { IGenerateLessonSeriesModel } from '../models/lesson-groups/generate-lesson-series.model';
import { ICreateLessonGroupWithLessonsModel } from '../models/lesson-groups/create-lesson-group-with-lessons.model';
import { ILessonGroupWithLessonsModel } from '../models/lesson-groups/lesson-group-with-lessons.model';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

interface IRecurrenceModel {
  intervalDays?: number;
  repeatCount?: number;
  dates?: Date[];
}

export type TLessonGroupOwnership = Pick<LessonsGroupEntity, 'createdByTeacherId' | 'departmentId'>;

const NO_OWNERSHIP: TLessonGroupOwnership = { createdByTeacherId: null, departmentId: null, };

/**
 * General lesson groups logic without any scope restrictions (admin / manage_lessons).
 * Scoped services check access first and then delegate here.
 */
@Injectable()
export class LessonsGroupsService {
  constructor(
    @InjectRepository(LessonsGroupEntity)
    private lessonGroupsRepository: Repository<LessonsGroupEntity>,
    @InjectRepository(LessonEntity)
    private lessonsRepository: Repository<LessonEntity>,
    private readonly lessonGroupsMapper: LessonGroupsMapper,
    private readonly lessonsService: LessonsService,
  ) {}

  async getLessonGroupsDictionary(): Promise<ILessonGroupDictionaryItem[]> {
    const lessonGroups = await this.lessonGroupsRepository.find({
      select: ['id', 'name',]
    });
    return lessonGroups.map(
      (g) => this.lessonGroupsMapper.entityToDictionaryItem(g)
    );
  }

  async getAll(params: IGetLessonGroupsFiltersModel, departmentId?: string): Promise<IGenericListPayloadResponse<ILessonGroupListItemModel>> {
    const { page, pageSize, search, } = params;
    const lessonGroupsQb = this.lessonGroupsRepository
      .createQueryBuilder('lsgroups')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (search) {
      lessonGroupsQb.andWhere('lsgroups.name ILIKE :search', { search: `%${search}%`, });
    }
    if (departmentId) {
      lessonGroupsQb.andWhere('lsgroups.departmentId = :departmentId', { departmentId, });
    }

    const [lsGroupsData, total] = await lessonGroupsQb.getManyAndCount();

    return {
      items: lsGroupsData.map(
        (s) => this.lessonGroupsMapper.entityToListItem(s)
      ),
      meta: { count: total, },
    };
  }

  async getById(lessonGroupId: string): Promise<ILessonGroupItemModel> {
    const lessonGroup = await this.lessonGroupsRepository.findOneOrFail({
      where: { id: lessonGroupId, }
    });
    return this.lessonGroupsMapper.entityToItem(lessonGroup);
  }

  async createLessonGroup(data: ICreateLessonGroupModel, ownership: TLessonGroupOwnership = NO_OWNERSHIP): Promise<ILessonGroupItemModel> {
    const newLessonGroup = this.lessonGroupsRepository.create({
      name: data.name,
      note: data.note,
      ...ownership,
    },);
    const createdLessonGroup = await this.lessonGroupsRepository.save(newLessonGroup);
    return this.lessonGroupsMapper.entityToItem(createdLessonGroup);
  }

  async editLessonGroup(data: IEditLessonGroupModel, lessonGroupId: string): Promise<boolean> {
    const updatedLessonGroup = await this.lessonGroupsRepository.update(
      { id: lessonGroupId, },
      {
        name: data.name,
        note: data.note,
      },
    );
    return !!updatedLessonGroup.affected;
  }

  async deleteLessonGroup(lessonGroupId: string): Promise<ILessonGroupItemModel> {
    const lessonGroupData = await this.lessonGroupsRepository.findOneOrFail({
      where: { id: lessonGroupId, }
    });
    const removedLessonGroup = await this.lessonGroupsRepository.remove(lessonGroupData);
    return this.lessonGroupsMapper.entityToItem({ ...removedLessonGroup, id: lessonGroupId, });
  }

  async assignLessonToGroup(lessonGroupId: string, lessonId: string): Promise<boolean> {
    await this.lessonGroupsRepository.findOneOrFail({
      where: { id: lessonGroupId, },
    });
    await this.lessonsService.editLesson(lessonId, { lessonGroupId, });
    return true;
  }

  async generateLessonSeries(data: IGenerateLessonSeriesModel): Promise<ILessonItemModel[]> {
    const baseLesson = await this.lessonsRepository.findOneOrFail({
      where: { id: data.baseLessonId, },
      relations: { teacherLessons: true, studentGroupLessons: true, },
    });

    const dates = this.resolveRecurrenceDates(baseLesson.date, 1, data);

    const createdLessons: ILessonItemModel[] = [];
    for (const date of dates) {
      const createdLesson = await this.lessonsService.createLesson({
        name: baseLesson.name,
        date,
        duration: baseLesson.duration,
        semesterId: baseLesson.semesterId!,
        lessonGroupId: baseLesson.lessonGroupId,
        note: baseLesson.note ?? undefined,
        teacherIds: baseLesson.teacherLessons.map((teacherLesson) => teacherLesson.teacherId),
        studentGroupIds: baseLesson.studentGroupLessons.map((studentGroupLesson) => studentGroupLesson.studentGroupId),
        visibility: baseLesson.visibility,
      });
      createdLessons.push(createdLesson);
    }

    return createdLessons;
  }

  async createLessonGroupWithLessons(
    data: ICreateLessonGroupWithLessonsModel,
    ownership: TLessonGroupOwnership = NO_OWNERSHIP,
  ): Promise<ILessonGroupWithLessonsModel> {
    const dates = this.resolveRecurrenceDates(data.date, 0, data);

    const newLessonGroup = this.lessonGroupsRepository.create({
      name: data.name,
      note: data.note,
      ...ownership,
    },);
    const createdLessonGroup = await this.lessonGroupsRepository.save(newLessonGroup);

    const lessons: ILessonItemModel[] = [];
    for (const date of dates) {
      const createdLesson = await this.lessonsService.createLesson({
        name: data.name,
        date,
        duration: data.duration,
        semesterId: data.semesterId,
        lessonGroupId: createdLessonGroup.id,
        note: data.note,
        teacherIds: data.teacherIds,
        studentGroupIds: data.studentGroupIds,
        visibility: data.visibility,
      });
      lessons.push(createdLesson);
    }

    return {
      lessonGroup: this.lessonGroupsMapper.entityToItem(createdLessonGroup),
      lessons,
    };
  }

  private resolveRecurrenceDates(anchorDate: Date, startIndex: number, recurrence: IRecurrenceModel): Date[] {
    if (recurrence.dates && recurrence.dates.length > 0) {
      return recurrence.dates;
    }
    if (recurrence.intervalDays && recurrence.repeatCount) {
      return Array.from({ length: recurrence.repeatCount, }, (_, index) =>
        new Date(anchorDate.getTime() + (startIndex + index) * recurrence.intervalDays! * DAY_IN_MS),
      );
    }
    throw new BadRequestException('Provide either `dates` or `intervalDays` together with `repeatCount`');
  }
}
