import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, FindOptionsRelations, In, Repository, SelectQueryBuilder } from 'typeorm';
import { LessonEntity } from '../entities/lesson.entity';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { LessonsMapper } from '../mappers/lessons.mapper';
import { ILessonListItemModel } from '../models/lessons/lesson-list-item.model';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';
import { ICreateLessonModel } from '../models/lessons/create-lesson.model';
import { LessonsGroupEntity } from '../entities/lessons-group.entity';
import { LessonDepartmentEntity } from '../entities/lesson-department.entity';
import { DepartmentEntity } from 'src/modules/departments/entities/department.entity';
import { SemesterEntity } from 'src/modules/semester/entities/semester.entity';
import { IEditLessonModel } from '../models/lessons/edit-lesson.model';
import { TeacherLessonEntity } from '../entities/teacher-lesson.entity';
import { StudentGroupLessonEntity } from '../entities/student-group-lesson.entity';
import { ILessonsFiltersModel } from '../models/lessons/lessons-filters.model';
import { IPaginationFilters } from 'src/shared/models/pagination-filters.model';
import { TeacherEntity } from 'src/modules/users/entities/teacher.entity';

// everything the mapper needs for the names in responses
const ITEM_RELATIONS: FindOptionsRelations<LessonEntity> = {
  teacherLessons: { teacher: { user: true, }, },
  studentGroupLessons: { studentGroup: true, },
  lessonDepartments: { department: true, },
  lessonGroup: true,
};

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
    @InjectRepository(LessonsGroupEntity)
    private lessonGroupsRepository: Repository<LessonsGroupEntity>,
    @InjectRepository(LessonDepartmentEntity)
    private lessonDepartmentRepository: Repository<LessonDepartmentEntity>,
    @InjectRepository(DepartmentEntity)
    private departmentsRepository: Repository<DepartmentEntity>,
    private readonly lessonsMapper: LessonsMapper,
  ) {}

  async getById(id: string): Promise<ILessonItemModel> {
    const lesson = await this.lessonsRepository.findOneOrFail({
      where: { id, },
      relations: ITEM_RELATIONS,
    });
    return this.lessonsMapper.entityToItem(lesson, true);
  }

  async findWithRelations(id: string): Promise<LessonEntity | null> {
    return await this.lessonsRepository.findOne({
      where: { id, },
      relations: { teacherLessons: true, studentGroupLessons: true, lessonDepartments: true, },
    });
  }

  async createLesson({ teacherIds, studentGroupIds, departmentIds = [], semesterId, ...data }: ICreateLessonModel): Promise<ILessonItemModel> {
    const lessonTeacherIds = await this.assertTeachersExist(teacherIds);
    const lessonDepartmentIds = await this.assertDepartmentsExist(departmentIds);
    await this.assertLessonGroupExists(data.lessonGroupId);

    const createdLesson = await this.lessonsRepository.save(
      this.lessonsRepository.create({ ...data, semesterId: semesterId ?? undefined, }),
    );

    await this.teacherLessonRepository.insert(
      lessonTeacherIds.map((teacherId) => ({ teacherId, lessonId: createdLesson.id, })),
    );
    if (studentGroupIds.length > 0) {
      await this.studentGroupLessonRepository.insert(
        studentGroupIds.map((studentGroupId) => ({ studentGroupId, lessonId: createdLesson.id, })),
      );
    }
    if (lessonDepartmentIds.length > 0) {
      await this.lessonDepartmentRepository.insert(
        lessonDepartmentIds.map((departmentId) => ({ departmentId, lessonId: createdLesson.id, })),
      );
    }

    return this.getById(createdLesson.id);
  }

  async editLesson(lessonId: string, { teacherIds, studentGroupIds, departmentIds, ...data }: IEditLessonModel): Promise<ILessonItemModel> {
    const lesson = await this.lessonsRepository.findOneOrFail({
      where: { id: lessonId, },
    });
    await this.assertLessonGroupExists(data.lessonGroupId);
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

    if (departmentIds) {
      const lessonDepartmentIds = await this.assertDepartmentsExist(departmentIds);
      await this.lessonDepartmentRepository.delete({ lessonId, });
      if (lessonDepartmentIds.length > 0) {
        await this.lessonDepartmentRepository.insert(
          lessonDepartmentIds.map((departmentId) => ({ departmentId, lessonId, })),
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

  /** Everything a lesson refers to, checked up front (e.g. before a series starts writing) */
  async assertLessonRefsExist({ teacherIds, departmentIds = [], semesterId, }: Pick<ICreateLessonModel, 'teacherIds' | 'departmentIds' | 'semesterId'>): Promise<void> {
    await this.assertTeachersExist(teacherIds);
    await this.assertDepartmentsExist(departmentIds);
    if (semesterId) {
      await this.lessonsRepository.manager.getRepository(SemesterEntity).findOneOrFail({ where: { id: semesterId, }, });
    }
  }

  /** Returns the ids without duplicates */
  async assertDepartmentsExist(departmentIds: string[]): Promise<string[]> {
    const ids = [...new Set(departmentIds)];
    if (ids.length > 0 && await this.departmentsRepository.count({ where: { id: In(ids), }, }) !== ids.length) {
      throw new BadRequestException('Some of the lesson departments do not exist');
    }
    return ids;
  }

  async assertLessonGroupExists(lessonGroupId: string | null | undefined): Promise<void> {
    if (lessonGroupId) {
      await this.lessonGroupsRepository.findOneOrFail({ where: { id: lessonGroupId, }, });
    }
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

  buildLessonsQuery({
    dateFrom, dateTo, search, teacherIds, studentGroupIds, groupTagIds, departmentIds, lessonGroupIds, semesterIds, visibility,
  }: ILessonsFiltersModel): SelectQueryBuilder<LessonEntity> {
    const lessonsQb = this.lessonsRepository.createQueryBuilder('ls');

    if (dateFrom) {
      lessonsQb.andWhere('ls.date >= :dateFrom', { dateFrom, });
    }
    if (dateTo) {
      lessonsQb.andWhere('ls.date <= :dateTo', { dateTo, });
    }
    if (visibility) {
      lessonsQb.andWhere('ls.visibility = :filterVisibility', { filterVisibility: visibility, });
    }
    if (departmentIds?.length) {
      lessonsQb.andWhere(
        'EXISTS (SELECT 1 FROM lesson_departments fld WHERE fld.lesson_id = ls.id AND fld.department_id IN (:...filterDepartmentIds))',
        { filterDepartmentIds: departmentIds, },
      );
    }
    if (lessonGroupIds?.length) {
      lessonsQb.andWhere('ls.lessonGroupId IN (:...filterLessonGroupIds)', { filterLessonGroupIds: lessonGroupIds, });
    }
    if (semesterIds?.length) {
      lessonsQb.andWhere('ls.semesterId IN (:...filterSemesterIds)', { filterSemesterIds: semesterIds, });
    }
    if (teacherIds?.length) {
      lessonsQb.andWhere(
        'EXISTS (SELECT 1 FROM teacher_lesson ftl WHERE ftl.lesson_id = ls.id AND ftl.teacher_id IN (:...filterTeacherIds))',
        { filterTeacherIds: teacherIds, },
      );
    }
    if (studentGroupIds?.length) {
      lessonsQb.andWhere(
        'EXISTS (SELECT 1 FROM student_group_lesson fsgl WHERE fsgl.lesson_id = ls.id AND fsgl.student_group_id IN (:...filterStudentGroupIds))',
        { filterStudentGroupIds: studentGroupIds, },
      );
    }
    if (groupTagIds?.length) {
      lessonsQb.andWhere(
        `EXISTS (
          SELECT 1 FROM student_group_lesson tsgl
          JOIN student_group_tags tsgt ON tsgt.student_group_id = tsgl.student_group_id
          WHERE tsgl.lesson_id = ls.id AND tsgt.group_tag_id IN (:...filterGroupTagIds)
        )`,
        { filterGroupTagIds: groupTagIds, },
      );
    }
    const searchText = search?.trim();
    if (searchText) {
      lessonsQb.andWhere(new Brackets((searchQb) => {
        searchQb
          .where('ls.name ILIKE :search')
          .orWhere('ls.note ILIKE :search')
          .orWhere('EXISTS (SELECT 1 FROM lessons_group slg WHERE slg.id = ls.lessonGroupId AND slg.name ILIKE :search)')
          .orWhere(`EXISTS (
            SELECT 1 FROM teacher_lesson stl
            JOIN teachers st ON st.id = stl.teacher_id
            JOIN users su ON su.id = st.user_id
            WHERE stl.lesson_id = ls.id AND su."fullName" ILIKE :search
          )`)
          .orWhere(`EXISTS (
            SELECT 1 FROM student_group_lesson ssgl
            JOIN student_groups ssg ON ssg.id = ssgl.student_group_id
            WHERE ssgl.lesson_id = ls.id AND ssg.name ILIKE :search
          )`);
      }), { search: `%${searchText}%`, });
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
        relations: ITEM_RELATIONS,
      })
      : [];
    const lessonsById = new Map(lessonsWithRelations.map((lesson) => [lesson.id, lesson]));

    return lessons.map(
      (lesson) => this.lessonsMapper.entityToListItem(lessonsById.get(lesson.id) ?? lesson, true)
    );
  }
}
