import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { LessonEntity } from '../entities/lesson.entity';
import { IGetLessonsFiltersModel } from '../models/lessons/get-lessons-filter.model';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { LessonsMapper } from '../mappers/lessons.mapper';
import { ILessonListItemModel } from '../models/lessons/lesson-list-item.model';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';
import { ICreateLessonModel } from '../models/lessons/create-lesson.model';
import { IEditLessonModel } from '../models/lessons/edit-lesson.model';
import { TeacherLessonEntity } from '../entities/teacher-lesson.entity';
import { StudentGroupLessonEntity } from '../entities/student-group-lesson.entity';

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
    const { page, pageSize, dateFrom, dateTo, group, teacher, } = params;
    const semQb = this.lessonsRepository
      .createQueryBuilder('ls')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (dateFrom) {
      semQb.andWhere('(ls.date >= :dateFrom)', { dateFrom, });
    }
    if (dateTo) {
      semQb.andWhere('(ls.date <= :dateTo)', { dateTo, });
    }

    const [lsData, total] = await semQb
      .distinct(true)
      .getManyAndCount();

    return {
      items: lsData.map(
        (s) => this.lessonsMapper.entityToListItem(s)
      ),
      meta: { count: total, },
    };
  };

  async getById(id: string): Promise<ILessonItemModel> {
    const lesson = await this.lessonsRepository.findOneOrFail({
      where: { id, }
    });
    return this.lessonsMapper.entityToItem(lesson);
  }

  async createLesson({ teacherIds, studentGroupIds, ...data }: ICreateLessonModel) {
    const lesson = this.lessonsRepository.create({
      ...data,
    },);

    if (teacherIds && teacherIds.length > 0) {
      const lessonTeachers = teacherIds.map((teacherId) =>
        this.teacherLessonRepository.create({
          lessonId: lesson.id,
          teacherId: teacherId,
        }),
      );

      await this.teacherLessonRepository.save(lessonTeachers);
    }

    if (studentGroupIds && studentGroupIds.length > 0) {
      const lessonGroups = teacherIds.map((groupId) =>
        this.studentGroupLessonRepository.create({
          lessonId: lesson.id,
          studentGroupId: groupId,
        }),
      );

      await this.studentGroupLessonRepository.save(lessonGroups);
    }

    const createdLessons = await this.lessonsRepository.save(lesson);
    return this.lessonsMapper.entityToItem(createdLessons);
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
      await this.teacherLessonRepository.delete({ lessonId });

      if (studentGroupIds.length > 0) {
        await this.studentGroupLessonRepository.insert(
          studentGroupIds.map((studentGroupId) => ({
            lessonId,
            studentGroupId,
          })),
        );
      }
    }

    const savedLesson = await this.lessonsRepository.save(lesson);

    return this.lessonsMapper.entityToItem(savedLesson);
  }

  async deleteLesson(lessonId: string): Promise<void> {
    const lessonData = await this.lessonsRepository.findOneOrFail({
      where: { id: lessonId, }
    });
    await this.lessonsRepository.remove(lessonData);
  }
}
