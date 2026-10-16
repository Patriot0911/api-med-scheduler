import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { LessonEntity } from '../entities/lesson.entity';
import { IGetLessonsFiltersModel } from '../models/lessons/get-lessons-filter.model';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { LessonsMapper } from '../mappers/lessons.mapper';
import { ILessonListItemModel } from '../models/lessons/lesson-list-item.model';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';
import { ICreateLessonModel } from '../models/lessons/create-lesson.model';
import { IEditLessonModel } from '../models/lessons/edit-lesson.model';
import { LessonVisibility } from '../models/lesson-visibility.enum';
import { TeacherLessonEntity } from '../entities/teacher-lesson.entity';
import { StudentGroupLessonEntity } from '../entities/student-group-lesson.entity';
import { ILessonsFiltersModel } from '../models/lessons/lessons-filters.model';
import { IPaginationFilters } from 'src/shared/models/pagination-filters.model';

/**
 * General lessons logic without any scope restrictions (admin / manage_lessons),
 * plus the shared query helpers used by the scoped services.
 */
@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(LessonEntity)
    private lessonsRepository: Repository<LessonEntity>,
    @InjectRepository(TeacherLessonEntity)
    private teacherLessonRepository: Repository<TeacherLessonEntity>,
    @InjectRepository(StudentGroupLessonEntity)
    private studentGroupLessonRepository: Repository<StudentGroupLessonEntity>,
    private readonly lessonsMapper: LessonsMapper,
  ) {}

  async getAll(params: IGetLessonsFiltersModel): Promise<IGenericListPayloadResponse<ILessonListItemModel>> {
    const lessonsQb = this.buildLessonsQuery(params);
    return await this.getPage(lessonsQb, params);
  }

  /** Public lessons for the public calendar: no auth, no pagination. */
  async getPublicLessons(filters: ILessonsFiltersModel): Promise<ILessonListItemModel[]> {
    const lessonsQb = this.buildLessonsQuery(filters)
      .andWhere('ls.visibility = :publicVisibility', { publicVisibility: LessonVisibility.PUBLIC, });
    return await this.getList(lessonsQb);
  }

  async getById(id: string): Promise<ILessonItemModel> {
    const lesson = await this.lessonsRepository.findOneOrFail({
      where: { id, },
      relations: { teacherLessons: true, studentGroupLessons: true, },
    });
    return this.lessonsMapper.entityToItem(lesson);
  }

  async createLesson({ teacherIds, studentGroupIds, ...data }: ICreateLessonModel): Promise<ILessonItemModel> {
    const lesson = this.lessonsRepository.create({
      ...data,
    },);
    const createdLesson = await this.lessonsRepository.save(lesson);

    if (teacherIds && teacherIds.length > 0) {
      const lessonTeachers = teacherIds.map((teacherId) =>
        this.teacherLessonRepository.create({
          lessonId: createdLesson.id,
          teacherId: teacherId,
        }),
      );

      await this.teacherLessonRepository.save(lessonTeachers);
    }

    if (studentGroupIds && studentGroupIds.length > 0) {
      const lessonGroups = studentGroupIds.map((groupId) =>
        this.studentGroupLessonRepository.create({
          lessonId: createdLesson.id,
          studentGroupId: groupId,
        }),
      );

      await this.studentGroupLessonRepository.save(lessonGroups);
    }

    return this.getById(createdLesson.id);
  }

  async editLesson(lessonId: string, { teacherIds, studentGroupIds, ...data }: IEditLessonModel): Promise<ILessonItemModel> {
    const lesson = await this.lessonsRepository.findOneOrFail({
      where: { id: lessonId, },
    });

    Object.assign(lesson, { ...data, });

    if (teacherIds) {
      await this.teacherLessonRepository.delete({ lessonId });

      if (teacherIds.length > 0) {
        await this.teacherLessonRepository.insert(
          teacherIds.map((teacherId) => ({
            lessonId,
            teacherId,
          })),
        );
      }
    }

    if (studentGroupIds) {
      await this.studentGroupLessonRepository.delete({ lessonId });

      if (studentGroupIds.length > 0) {
        await this.studentGroupLessonRepository.insert(
          studentGroupIds.map((studentGroupId) => ({
            lessonId,
            studentGroupId,
          })),
        );
      }
    }

    await this.lessonsRepository.save(lesson);

    return this.getById(lessonId);
  }

  async deleteLesson(lessonId: string): Promise<void> {
    const lessonData = await this.lessonsRepository.findOneOrFail({
      where: { id: lessonId, }
    });
    await this.lessonsRepository.remove(lessonData);
  }

  buildLessonsQuery({ dateFrom, dateTo, teacherId, studentGroupId, }: ILessonsFiltersModel): SelectQueryBuilder<LessonEntity> {
    const lessonsQb = this.lessonsRepository.createQueryBuilder('ls');

    if (dateFrom) {
      lessonsQb.andWhere('(ls.date >= :dateFrom)', { dateFrom, });
    }
    if (dateTo) {
      lessonsQb.andWhere('(ls.date <= :dateTo)', { dateTo, });
    }
    if (teacherId) {
      lessonsQb.andWhere(
        'EXISTS (SELECT 1 FROM teacher_lesson ftl WHERE ftl.lesson_id = ls.id AND ftl.teacher_id = :filterTeacherId)',
        { filterTeacherId: teacherId, },
      );
    }
    if (studentGroupId) {
      lessonsQb.andWhere(
        'EXISTS (SELECT 1 FROM student_group_lesson fsgl WHERE fsgl.lesson_id = ls.id AND fsgl.student_group_id = :filterStudentGroupId)',
        { filterStudentGroupId: studentGroupId, },
      );
    }

    return lessonsQb;
  }

  async getPage(
    lessonsQb: SelectQueryBuilder<LessonEntity>,
    { page, pageSize, }: IPaginationFilters,
  ): Promise<IGenericListPayloadResponse<ILessonListItemModel>> {
    const [lsData, total] = await lessonsQb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: await this.toListItems(lsData),
      meta: { count: total, },
    };
  }

  /** Unpaginated list ordered by date, for calendars. */
  async getList(lessonsQb: SelectQueryBuilder<LessonEntity>): Promise<ILessonListItemModel[]> {
    const lessonsData = await lessonsQb
      .orderBy('ls.date', 'ASC')
      .getMany();
    return await this.toListItems(lessonsData);
  }

  /** The list query only filters through relations; load them fully for the mapper. */
  private async toListItems(lessons: LessonEntity[]): Promise<ILessonListItemModel[]> {
    const lessonsWithRelations = lessons.length
      ? await this.lessonsRepository.find({
        where: { id: In(lessons.map((lesson) => lesson.id)), },
        relations: { teacherLessons: true, studentGroupLessons: true, },
      })
      : [];
    const lessonsById = new Map(lessonsWithRelations.map((lesson) => [lesson.id, lesson]));

    return lessons.map(
      (lesson) => this.lessonsMapper.entityToListItem(lessonsById.get(lesson.id) ?? lesson)
    );
  }
}
