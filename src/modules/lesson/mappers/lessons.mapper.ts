import { Injectable } from '@nestjs/common';
import { LessonEntity } from '../entities/lesson.entity';
import { ILessonListItemModel } from '../models/lessons/lesson-list-item.model';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';

@Injectable()
export class LessonsMapper {
  entityToListItem(entity: LessonEntity): ILessonListItemModel {
    return this.entityToItem(entity);
  }

  entityToItem(entity: LessonEntity): ILessonItemModel {
    const { id, name, date, duration, delayedDate, note, semesterId, lessonGroupId, teacherLessons, studentGroupLessons, } = entity;
    return {
      id, name, date, duration, delayedDate, note, lessonGroupId,
      semesterId: semesterId ?? null,
      teacherIds: (teacherLessons ?? []).map((teacherLesson) => teacherLesson.teacherId),
      studentGroupIds: (studentGroupLessons ?? []).map((studentGroupLesson) => studentGroupLesson.studentGroupId),
    };
  }
}
