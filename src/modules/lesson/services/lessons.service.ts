import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { LessonEntity } from '../entities/lesson.entity';
import { IGetLessonsFiltersModel } from '../models/lessons/get-lessons-filter.model';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { LessonsMapper } from '../mappers/lessons.mapper';
import { ILessonListItemModel } from '../models/lessons/lesson-list-item.model';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';
import { ICreateLessonModel } from '../models/lessons/create-lesson.model';
import { IEditLessonModel } from '../models/lessons/edit-lesson.model';
import { ITeacherUpdateLessonModel } from '../models/lessons/teacher-update-lesson.model';
import { TeacherLessonEntity } from '../entities/teacher-lesson.entity';
import { StudentGroupLessonEntity } from '../entities/student-group-lesson.entity';
import { TeacherEntity } from 'src/modules/users/entities/teacher.entity';
import { Permission } from 'src/shared/models/permission.enum';

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

  async getAll(params: IGetLessonsFiltersModel): Promise<IGenericListPayloadResponse<ILessonListItemModel>> {
    const { page, pageSize, dateFrom, dateTo, group, teacher, } = params;
    const lessonsQb = this.lessonsRepository
      .createQueryBuilder('ls')
      .leftJoin('ls.teacherLessons', 'teacherLessons')
      .leftJoin('teacherLessons.teacher', 'teacher')
      .leftJoin('teacher.user', 'teacherUser')
      .leftJoin('ls.studentGroupLessons', 'studentGroupLessons')
      .leftJoin('studentGroupLessons.studentGroup', 'studentGroup')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (dateFrom) {
      lessonsQb.andWhere('(ls.date >= :dateFrom)', { dateFrom, });
    }
    if (dateTo) {
      lessonsQb.andWhere('(ls.date <= :dateTo)', { dateTo, });
    }
    if (teacher) {
      lessonsQb.andWhere('teacherUser.fullName LIKE :teacher', { teacher: `%${teacher}%`, });
    }
    if (group) {
      lessonsQb.andWhere('studentGroup.name LIKE :group', { group: `%${group}%`, });
    }

    const [lsData, total] = await lessonsQb
      .distinct(true)
      .getManyAndCount();

    const lessonsWithRelations = lsData.length
      ? await this.lessonsRepository.find({
        where: { id: In(lsData.map((lesson) => lesson.id)), },
        relations: { teacherLessons: true, studentGroupLessons: true, },
      })
      : [];
    const lessonsById = new Map(lessonsWithRelations.map((lesson) => [lesson.id, lesson]));

    return {
      items: lsData.map(
        (s) => this.lessonsMapper.entityToListItem(lessonsById.get(s.id) ?? s)
      ),
      meta: { count: total, },
    };
  };

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

  async updateLessonAsTeacher(
    lessonId: string,
    userId: string,
    permissions: Permission[],
    data: ITeacherUpdateLessonModel,
  ): Promise<ILessonItemModel> {
    const lesson = await this.lessonsRepository.findOneOrFail({
      where: { id: lessonId, },
      relations: { teacherLessons: true, },
    });

    const teacherProfile = await this.teachersRepository.findOne({
      where: { userId, },
    });

    const isAssignedTeacher = !!teacherProfile
      && lesson.teacherLessons.some((teacherLesson) => teacherLesson.teacherId === teacherProfile.id);
    const hasManageAccess = permissions.includes(Permission.ADMIN) || permissions.includes(Permission.MANAGE_LESSONS);

    if (!isAssignedTeacher && !hasManageAccess) {
      throw new ForbiddenException('Only a teacher assigned to this lesson can update it');
    }

    if (data.note !== undefined) {
      lesson.note = data.note;
    }
    if (data.delayedDate !== undefined) {
      lesson.delayedDate = data.delayedDate;
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
}
