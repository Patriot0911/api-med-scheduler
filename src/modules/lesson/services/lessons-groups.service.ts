import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessonsGroupEntity } from '../entities/lessons-group.entity';
import { In, Repository } from 'typeorm';
import { IGetLessonGroupsFiltersModel } from '../models/lesson-groups/get-lesson-groups-filter.model';
import { ILessonGroupStats, LessonGroupsMapper } from '../mappers/lesson-groups.mapper';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { ILessonGroupListItemModel } from '../models/lesson-groups/lesson-group-list-item.model';
import { ILessonGroupItemModel } from '../models/lesson-groups/lesson-group-item.model';
import { ICreateLessonGroupModel } from '../models/lesson-groups/create-lesson-group.model';
import { IEditLessonGroupModel } from '../models/lesson-groups/edit-lesson-group.model';
import { ILessonGroupDictionaryItem } from '../models/lesson-groups/lesson-group-dictionary-item.model';
import { LessonEntity } from '../entities/lesson.entity';
import { LessonsService } from './lessons.service';
import { IGenerateLessonSeriesModel } from '../models/lesson-groups/generate-lesson-series.model';
import { IAddLessonsToGroupModel, ICreateLessonGroupWithLessonsModel, TLessonTemplateModel } from '../models/lesson-groups/create-lesson-group-with-lessons.model';
import { ILessonGroupWithLessonsModel } from '../models/lesson-groups/lesson-group-with-lessons.model';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

interface IRecurrenceModel {
  intervalDays?: number;
  repeatCount?: number;
  dates?: Date[];
}

export type TLessonGroupOwnership = Pick<LessonsGroupEntity, 'createdByTeacherId' | 'departmentId'>;

export const NO_OWNERSHIP: TLessonGroupOwnership = { createdByTeacherId: null, departmentId: null, };

/** Lesson groups without any access restrictions, see LessonsService */
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

  async getAll(params: IGetLessonGroupsFiltersModel): Promise<IGenericListPayloadResponse<ILessonGroupListItemModel>> {
    const { page, pageSize, search, departmentId, } = params;
    const lessonGroupsQb = this.lessonGroupsRepository
      .createQueryBuilder('lsgroups')
      .leftJoinAndSelect('lsgroups.department', 'department')
      .leftJoinAndSelect('lsgroups.createdByTeacher', 'creator')
      .leftJoinAndSelect('creator.user', 'creatorUser')
      .orderBy('lsgroups.name', 'ASC')
      .addOrderBy('lsgroups.id', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (search) {
      lessonGroupsQb.andWhere('lsgroups.name ILIKE :search', { search: `%${search}%`, });
    }
    if (departmentId) {
      lessonGroupsQb.andWhere('lsgroups.departmentId = :departmentId', { departmentId, });
    }

    const [lsGroupsData, total] = await lessonGroupsQb.getManyAndCount();
    const statsById = await this.getStats(lsGroupsData.map((group) => group.id));

    return {
      items: lsGroupsData.map(
        (group) => this.lessonGroupsMapper.entityToListItem(group, statsById.get(group.id))
      ),
      meta: { count: total, },
    };
  }

  private async getStats(lessonGroupIds: string[]): Promise<Map<string, ILessonGroupStats>> {
    if (lessonGroupIds.length === 0) {
      return new Map();
    }
    const rows = await this.lessonsRepository
      .createQueryBuilder('ls')
      .select('ls.lessonGroupId', 'lessonGroupId')
      .addSelect('COUNT(*)::int', 'lessonsCount')
      .addSelect('MIN(ls.date)', 'firstLessonDate')
      .addSelect('MAX(ls.date)', 'lastLessonDate')
      .where('ls.lessonGroupId IN (:...lessonGroupIds)', { lessonGroupIds, })
      .groupBy('ls.lessonGroupId')
      .getRawMany<{ lessonGroupId: string } & ILessonGroupStats>();
    return new Map(rows.map(({ lessonGroupId, ...stats }) => [lessonGroupId, stats]));
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

  /** Without `withLessons` the lessons stay, out of any group (ON DELETE SET NULL) */
  async deleteLessonGroup(lessonGroupId: string, withLessons = false): Promise<ILessonGroupItemModel> {
    return await this.lessonGroupsRepository.manager.transaction(async (manager) => {
      const lessonGroupData = await manager.findOneOrFail(LessonsGroupEntity, {
        where: { id: lessonGroupId, }
      });
      if (withLessons) {
        await manager.delete(LessonEntity, { lessonGroupId, });
      }
      await manager.remove(lessonGroupData);
      return this.lessonGroupsMapper.entityToItem({ ...lessonGroupData, id: lessonGroupId, });
    });
  }

  async assignLessonToGroup(lessonGroupId: string, lessonId: string): Promise<boolean> {
    await this.lessonGroupsRepository.findOneOrFail({
      where: { id: lessonGroupId, },
    });
    await this.lessonsService.editLesson(lessonId, { lessonGroupId, });
    return true;
  }

  /** Moves existing lessons into the group, from another group or none; all of them must exist */
  async assignLessonsToGroup(lessonGroupId: string, lessonIds: string[]): Promise<number> {
    await this.lessonGroupsRepository.findOneOrFail({ where: { id: lessonGroupId, }, });
    const ids = [...new Set(lessonIds)];
    if (await this.lessonsRepository.count({ where: { id: In(ids), }, }) !== ids.length) {
      throw new BadRequestException('Some of the lessons do not exist');
    }
    await this.lessonsRepository.update({ id: In(ids), }, { lessonGroupId, });
    return ids.length;
  }

  /** Takes the lessons out of this group; lessons of other groups are left as they are. Returns how many left it. */
  async removeLessonsFromGroup(lessonGroupId: string, lessonIds: string[]): Promise<number> {
    await this.lessonGroupsRepository.findOneOrFail({ where: { id: lessonGroupId, }, });
    const { affected, } = await this.lessonsRepository.update(
      { id: In([...new Set(lessonIds)]), lessonGroupId, },
      { lessonGroupId: null, },
    );
    return affected ?? 0;
  }

  async generateLessonSeries(data: IGenerateLessonSeriesModel): Promise<ILessonItemModel[]> {
    const baseLesson = await this.lessonsRepository.findOneOrFail({
      where: { id: data.baseLessonId, },
      relations: { teacherLessons: true, studentGroupLessons: true, lessonDepartments: true, },
    });

    if (!baseLesson.lessonGroupId) {
      throw new BadRequestException('Put the lesson into a group before repeating it');
    }
    const dates = this.resolveRecurrenceDates(baseLesson.date, 1, data);

    const createdLessons: ILessonItemModel[] = [];
    for (const date of dates) {
      const createdLesson = await this.lessonsService.createLesson({
        name: baseLesson.name,
        date,
        duration: baseLesson.duration,
        semesterId: baseLesson.semesterId!,
        lessonGroupId: baseLesson.lessonGroupId,
        departmentIds: baseLesson.lessonDepartments.map((lessonDepartment) => lessonDepartment.departmentId),
        note: baseLesson.note ?? undefined,
        teacherIds: baseLesson.teacherLessons.map((teacherLesson) => teacherLesson.teacherId),
        studentGroupIds: baseLesson.studentGroupLessons.map((studentGroupLesson) => studentGroupLesson.studentGroupId),
        visibility: baseLesson.visibility,
      });
      createdLessons.push(createdLesson);
    }

    return createdLessons;
  }

  /** Everything is checked before the group is written, so a bad request leaves no half-made series */
  async createLessonGroupWithLessons(
    { lessonGroup, lesson, dates, }: ICreateLessonGroupWithLessonsModel,
    ownership: TLessonGroupOwnership = NO_OWNERSHIP,
  ): Promise<ILessonGroupWithLessonsModel> {
    await this.lessonsService.assertLessonRefsExist(lesson);
    const createdLessonGroup = await this.lessonGroupsRepository.save(this.lessonGroupsRepository.create({
      name: lessonGroup.name,
      note: lessonGroup.note,
      ...ownership,
    }));
    return {
      lessonGroup: this.lessonGroupsMapper.entityToItem(createdLessonGroup),
      lessons: await this.createLessonsAt(createdLessonGroup.id, lesson, dates),
    };
  }

  async addLessonsToGroup(lessonGroupId: string, { lesson, dates, }: IAddLessonsToGroupModel): Promise<ILessonItemModel[]> {
    await this.lessonGroupsRepository.findOneOrFail({ where: { id: lessonGroupId, }, });
    await this.lessonsService.assertLessonRefsExist(lesson);
    return await this.createLessonsAt(lessonGroupId, lesson, dates);
  }

  /** One lesson per distinct date, in date order */
  private async createLessonsAt(lessonGroupId: string, lesson: TLessonTemplateModel, dates: Date[]): Promise<ILessonItemModel[]> {
    const lessonDates = [...new Set(dates.map((date) => date.getTime()))]
      .sort((a, b) => a - b)
      .map((time) => new Date(time));
    const lessons: ILessonItemModel[] = [];
    for (const date of lessonDates) {
      lessons.push(await this.lessonsService.createLesson({ ...lesson, date, lessonGroupId, }));
    }
    return lessons;
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
