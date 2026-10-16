import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { LessonEntity } from '../entities/lesson.entity';
import { TeacherEntity } from 'src/modules/users/entities/teacher.entity';
import { StudentEntity } from 'src/modules/users/entities/student.entity';
import { ILessonsFiltersModel } from '../models/lessons/lessons-filters.model';
import { ILessonListItemModel } from '../models/lessons/lesson-list-item.model';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';
import { ITeacherUpdateLessonModel } from '../models/lessons/teacher-update-lesson.model';
import { LessonsService } from './lessons.service';

/**
 * The user's own lessons, regardless of visibility:
 * a teacher sees the lessons they teach, a student — the lessons of their group.
 * A user with both profiles sees both.
 */
@Injectable()
export class MyLessonsService {
  constructor(
    @InjectRepository(LessonEntity)
    private lessonsRepository: Repository<LessonEntity>,
    @InjectRepository(TeacherEntity)
    private teachersRepository: Repository<TeacherEntity>,
    @InjectRepository(StudentEntity)
    private studentsRepository: Repository<StudentEntity>,
    private readonly lessonsService: LessonsService,
  ) {}

  async getMyLessons(userId: string, filters: ILessonsFiltersModel): Promise<ILessonListItemModel[]> {
    const lessonsQb = await this.buildMyLessonsQuery(userId, this.lessonsService.buildLessonsQuery(filters));
    if (!lessonsQb) {
      return [];
    }
    return await this.lessonsService.getList(lessonsQb);
  }

  async getMyLesson(userId: string, lessonId: string): Promise<ILessonItemModel> {
    const lessonsQb = await this.buildMyLessonsQuery(userId, this.lessonsService.buildLessonsQuery({}));
    const lesson = await lessonsQb
      ?.andWhere('ls.id = :lessonId', { lessonId, })
      .getOne();
    if (!lesson) {
      throw new NotFoundException('Lesson not found among your lessons');
    }
    return await this.lessonsService.getById(lesson.id);
  }

  /** A teacher assigned to the lesson may update its note and delayed date. */
  async updateMyLesson(userId: string, lessonId: string, data: ITeacherUpdateLessonModel): Promise<ILessonItemModel> {
    const teacherProfile = await this.teachersRepository.findOne({ where: { userId, }, });
    if (!teacherProfile) {
      throw new ForbiddenException('Only teachers can update their lessons');
    }

    const lesson = await this.lessonsRepository.findOne({
      where: { id: lessonId, teacherLessons: { teacherId: teacherProfile.id, }, },
    });
    if (!lesson) {
      throw new NotFoundException('Lesson not found among the lessons you teach');
    }

    if (data.note !== undefined) {
      lesson.note = data.note;
    }
    if (data.delayedDate !== undefined) {
      lesson.delayedDate = data.delayedDate;
    }
    await this.lessonsRepository.save(lesson);

    return await this.lessonsService.getById(lessonId);
  }

  /** Null when the user has neither a teacher profile nor a student group. */
  private async buildMyLessonsQuery(
    userId: string,
    lessonsQb: SelectQueryBuilder<LessonEntity>,
  ): Promise<SelectQueryBuilder<LessonEntity> | null> {
    const [teacherProfile, studentProfile] = await Promise.all([
      this.teachersRepository.findOne({ where: { userId, }, }),
      this.studentsRepository.findOne({ where: { userId, }, }),
    ]);
    const studentGroupId = studentProfile?.studentGroupId ?? null;

    if (!teacherProfile && !studentGroupId) {
      return null;
    }

    return lessonsQb.andWhere(new Brackets((myQb) => {
      if (teacherProfile) {
        myQb.orWhere(
          'EXISTS (SELECT 1 FROM teacher_lesson mytl WHERE mytl.lesson_id = ls.id AND mytl.teacher_id = :myTeacherId)',
          { myTeacherId: teacherProfile.id, },
        );
      }
      if (studentGroupId) {
        myQb.orWhere(
          'EXISTS (SELECT 1 FROM student_group_lesson mysgl WHERE mysgl.lesson_id = ls.id AND mysgl.student_group_id = :myStudentGroupId)',
          { myStudentGroupId: studentGroupId, },
        );
      }
    }));
  }
}
