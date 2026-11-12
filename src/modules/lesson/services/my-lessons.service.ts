import { Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';
import { ILessonsFiltersModel } from '../models/lessons/lessons-filters.model';
import { ILessonListItemModel } from '../models/lessons/lesson-list-item.model';
import { ILessonActorModel } from '../models/lesson-actor.model';
import { LessonsService } from './lessons.service';
import { ManagedLessonsService } from './managed-lessons.service';

/**
 * The user's own schedule: lessons they teach and lessons of their student group.
 * Both are involved in such lessons, so visibility does not narrow the list.
 */
@Injectable()
export class MyLessonsService {
  constructor(
    private readonly lessonsService: LessonsService,
    private readonly managedLessonsService: ManagedLessonsService,
  ) {}

  async getMyLessons(actor: ILessonActorModel, filters: ILessonsFiltersModel): Promise<ILessonListItemModel[]> {
    const { teacherId, studentGroupId, } = actor;
    if (!teacherId && !studentGroupId) {
      return [];
    }

    const lessonsQb = this.lessonsService.buildLessonsQuery(filters).andWhere(new Brackets((myQb) => {
      if (teacherId) {
        myQb.orWhere(
          'EXISTS (SELECT 1 FROM teacher_lesson mytl WHERE mytl.lesson_id = ls.id AND mytl.teacher_id = :myTeacherId)',
          { myTeacherId: teacherId, },
        );
      }
      if (studentGroupId) {
        myQb.orWhere(
          'EXISTS (SELECT 1 FROM student_group_lesson mysgl WHERE mysgl.lesson_id = ls.id AND mysgl.student_group_id = :myStudentGroupId)',
          { myStudentGroupId: studentGroupId, },
        );
      }
    }));

    const lessons = await this.lessonsService.getList(lessonsQb);
    return lessons.map((lesson) => this.managedLessonsService.withCanEdit(actor, lesson));
  }
}
