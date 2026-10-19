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
import { LessonVisibility } from '../models/lesson-visibility.enum';
import { TeacherLessonEntity } from '../entities/teacher-lesson.entity';
import { StudentGroupLessonEntity } from '../entities/student-group-lesson.entity';
import { ILessonsFiltersModel } from '../models/lessons/lessons-filters.model';
import { IPaginationFilters } from 'src/shared/models/pagination-filters.model';
import { TeacherEntity } from 'src/modules/users/entities/teacher.entity';

/**
 * General lessons logic without any access restrictions,
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
    @InjectRepository(TeacherEntity)
    private teachersRepository: Repository<TeacherEntity>,
    private readonly lessonsMapper: LessonsMapper,
  ) {}

  async getById(id: string): Promise<ILessonItemModel> {
    const lesson = await this.lessonsRepository.findOneOrFail({
      where: { id, },
      relations: { teacherLessons: true, studentGroupLessons: true, },
    });
    return this.lessonsMapper.entityToItem(lesson);
  }

  /** Callers resolve ownerTeacherId first (see LessonAccessService.resolveOwnerId). */
  async createLesson({ ownerTeacherId, teacherIds, editorTeacherIds, studentGroupIds, ...data }: ICreateLessonModel): Promise<ILessonItemModel> {
    if (!ownerTeacherId) {
      throw new BadRequestException('ownerTeacherId is required');
    }
    this.assertVisibilityFitsDepartment(data.visibility, data.departmentId);
    const lessonTeachers = await this.resolveLessonTeachers(ownerTeacherId, teacherIds, editorTeacherIds);

    const lesson = this.lessonsRepository.create({
      ...data,
    },);
    const createdLesson = await this.lessonsRepository.save(lesson);

    await this.teacherLessonRepository.insert(
      lessonTeachers.map((lessonTeacher) => ({ ...lessonTeacher, lessonId: createdLesson.id, })),
    );

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

  async editLesson(
    lessonId: string,
    { ownerTeacherId, teacherIds, editorTeacherIds, studentGroupIds, ...data }: IEditLessonModel,
  ): Promise<ILessonItemModel> {
    const lesson = await this.lessonsRepository.findOneOrFail({
      where: { id: lessonId, },
    });

    Object.assign(lesson, { ...data, });
    this.assertVisibilityFitsDepartment(lesson.visibility, lesson.departmentId);

    if (ownerTeacherId !== undefined || teacherIds !== undefined || editorTeacherIds !== undefined) {
      const currentTeachers = await this.teacherLessonRepository.find({ where: { lessonId, }, });
      const ownerId = ownerTeacherId ?? currentTeachers.find((teacherLesson) => teacherLesson.isOwner)?.teacherId;
      if (!ownerId) {
        throw new BadRequestException('ownerTeacherId is required');
      }
      const nextTeacherIds = teacherIds ?? currentTeachers.map((teacherLesson) => teacherLesson.teacherId);
      // editors that are no longer teachers of the lesson lose the flag silently, unless set explicitly
      const nextEditorIds = editorTeacherIds ?? currentTeachers
        .filter((teacherLesson) => teacherLesson.canEdit && nextTeacherIds.includes(teacherLesson.teacherId))
        .map((teacherLesson) => teacherLesson.teacherId);
      const lessonTeachers = await this.resolveLessonTeachers(ownerId, nextTeacherIds, nextEditorIds);

      await this.teacherLessonRepository.delete({ lessonId });
      await this.teacherLessonRepository.insert(
        lessonTeachers.map((lessonTeacher) => ({ ...lessonTeacher, lessonId, })),
      );
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

  /** Department-only lessons need a department to be visible in. */
  private assertVisibilityFitsDepartment(visibility: LessonVisibility | undefined, departmentId: string | null | undefined): void {
    if (visibility === LessonVisibility.DEPARTMENT && !departmentId) {
      throw new BadRequestException('A department-only lesson must have a department');
    }
  }

  /**
   * Validates the teachers of a lesson and builds its teacher_lesson rows:
   * the owner plus co-teachers (any department), editors being a subset of the co-teachers.
   */
  async resolveLessonTeachers(
    ownerTeacherId: string,
    teacherIds: string[] | undefined,
    editorTeacherIds: string[] | undefined,
  ): Promise<Pick<TeacherLessonEntity, 'teacherId' | 'isOwner' | 'canEdit'>[]> {
    const ids = [...new Set([ownerTeacherId, ...(teacherIds ?? [])])];
    const editorIds = new Set((editorTeacherIds ?? []).filter((teacherId) => teacherId !== ownerTeacherId));

    if ([...editorIds].some((teacherId) => !ids.includes(teacherId))) {
      throw new BadRequestException('Editors must be among the lesson teachers');
    }
    const existingCount = await this.teachersRepository.count({ where: { id: In(ids), }, });
    if (existingCount !== ids.length) {
      throw new BadRequestException('Some of the lesson teachers do not exist');
    }

    return ids.map((teacherId) => ({
      teacherId,
      isOwner: teacherId === ownerTeacherId,
      canEdit: editorIds.has(teacherId),
    }));
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
