import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { LessonEntity } from '../entities/lesson.entity';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { LessonsMapper } from '../mappers/lessons.mapper';
import { ILessonListItemModel } from '../models/lessons/lesson-list-item.model';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';
import { ICreateLessonModel } from '../models/lessons/create-lesson.model';
import { IEditLessonModel } from '../models/lessons/edit-lesson.model';
import { TeacherLessonEntity } from '../entities/teacher-lesson.entity';
import { StudentGroupLessonEntity } from '../entities/student-group-lesson.entity';
import { ILessonsFiltersModel } from '../models/lessons/lessons-filters.model';
import { IPaginationFilters } from 'src/shared/models/pagination-filters.model';
import { TeacherEntity } from 'src/modules/users/entities/teacher.entity';

/**
 * Lessons without any access restrictions: used as is by the admin endpoints and behind the access checks
 * by the teacher domain. Items come with `canEdit: true`; the teacher domain recomputes it for its actor.
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
    @InjectRepository(TeacherEntity)
    private teachersRepository: Repository<TeacherEntity>,
    private readonly lessonsMapper: LessonsMapper,
  ) {}

  async getById(id: string): Promise<ILessonItemModel> {
    const lesson = await this.lessonsRepository.findOneOrFail({
      where: { id, },
      relations: { teacherLessons: true, studentGroupLessons: true, },
    });
    return this.lessonsMapper.entityToItem(lesson, true);
  }

  async findWithRelations(id: string): Promise<LessonEntity | null> {
    return await this.lessonsRepository.findOne({
      where: { id, },
      relations: { teacherLessons: true, studentGroupLessons: true, },
    });
  }

  async createLesson({ teacherIds, studentGroupIds, ...data }: ICreateLessonModel): Promise<ILessonItemModel> {
    const lessonTeacherIds = await this.assertTeachersExist(teacherIds);

    const createdLesson = await this.lessonsRepository.save(this.lessonsRepository.create(data));

    await this.teacherLessonRepository.insert(
      lessonTeacherIds.map((teacherId) => ({ teacherId, lessonId: createdLesson.id, })),
    );
    if (studentGroupIds.length > 0) {
      await this.studentGroupLessonRepository.insert(
        studentGroupIds.map((studentGroupId) => ({ studentGroupId, lessonId: createdLesson.id, })),
      );
    }

    return this.getById(createdLesson.id);
  }

  async editLesson(lessonId: string, { teacherIds, studentGroupIds, ...data }: IEditLessonModel): Promise<ILessonItemModel> {
    const lesson = await this.lessonsRepository.findOneOrFail({
      where: { id: lessonId, },
    });
    Object.assign(lesson, data);

    if (teacherIds) {
      const lessonTeacherIds = await this.assertTeachersExist(teacherIds);
      await this.teacherLessonRepository.delete({ lessonId, });
      await this.teacherLessonRepository.insert(
        lessonTeacherIds.map((teacherId) => ({ teacherId, lessonId, })),
      );
    }

    if (studentGroupIds) {
      await this.studentGroupLessonRepository.delete({ lessonId, });
      if (studentGroupIds.length > 0) {
        await this.studentGroupLessonRepository.insert(
          studentGroupIds.map((studentGroupId) => ({ studentGroupId, lessonId, })),
        );
      }
    }

    await this.lessonsRepository.save(lesson);
    return this.getById(lessonId);
  }

  async deleteLesson(lessonId: string): Promise<void> {
    const lesson = await this.lessonsRepository.findOneOrFail({
      where: { id: lessonId, },
    });
    await this.lessonsRepository.remove(lesson);
  }

  /** A lesson keeps at least one teacher, and all of them must exist. Returns the ids without duplicates. */
  async assertTeachersExist(teacherIds: string[]): Promise<string[]> {
    const ids = [...new Set(teacherIds)];
    if (ids.length === 0) {
      throw new BadRequestException('A lesson needs at least one teacher');
    }
    const existingCount = await this.teachersRepository.count({ where: { id: In(ids), }, });
    if (existingCount !== ids.length) {
      throw new BadRequestException('Some of the lesson teachers do not exist');
    }
    return ids;
  }

  buildLessonsQuery({ dateFrom, dateTo, teacherId, studentGroupId, departmentId, visibility, }: ILessonsFiltersModel): SelectQueryBuilder<LessonEntity> {
    const lessonsQb = this.lessonsRepository.createQueryBuilder('ls');

    if (departmentId) {
      lessonsQb.andWhere('ls.departmentId = :filterDepartmentId', { filterDepartmentId: departmentId, });
    }
    if (visibility) {
      lessonsQb.andWhere('ls.visibility = :filterVisibility', { filterVisibility: visibility, });
    }
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

  /** A page when page / pageSize are given, otherwise the whole list. Ordered by date either way. */
  async getPage(
    lessonsQb: SelectQueryBuilder<LessonEntity>,
    { page, pageSize, }: Partial<IPaginationFilters>,
  ): Promise<IGenericListPayloadResponse<ILessonListItemModel>> {
    lessonsQb.orderBy('ls.date', 'ASC');
    if (page && pageSize !== undefined) {
      lessonsQb
        .skip((page - 1) * pageSize)
        .take(pageSize);
    }
    const [lsData, total] = await lessonsQb.getManyAndCount();

    return {
      items: await this.toListItems(lsData),
      meta: { count: total, },
    };
  }

  /** Unpaginated list ordered by date, for calendars */
  async getList(lessonsQb: SelectQueryBuilder<LessonEntity>): Promise<ILessonListItemModel[]> {
    const lessonsData = await lessonsQb
      .orderBy('ls.date', 'ASC')
      .getMany();
    return await this.toListItems(lessonsData);
  }

  /** The list query only filters through relations; load them fully for the mapper */
  private async toListItems(lessons: LessonEntity[]): Promise<ILessonListItemModel[]> {
    const lessonsWithRelations = lessons.length
      ? await this.lessonsRepository.find({
        where: { id: In(lessons.map((lesson) => lesson.id)), },
        relations: { teacherLessons: true, studentGroupLessons: true, },
      })
      : [];
    const lessonsById = new Map(lessonsWithRelations.map((lesson) => [lesson.id, lesson]));

    return lessons.map(
      (lesson) => this.lessonsMapper.entityToListItem(lessonsById.get(lesson.id) ?? lesson, true)
    );
  }
}
