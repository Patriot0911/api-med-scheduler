import { Injectable } from '@nestjs/common';
import { LessonEntity } from '../entities/lesson.entity';
import { ILessonListItemModel } from '../models/lessons/lesson-list-item.model';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';

@Injectable()
export class LessonsMapper {
  entityToListItem(entity: LessonEntity, canEdit: boolean): ILessonListItemModel {
    return this.entityToItem(entity, canEdit);
  }

  entityToItem(entity: LessonEntity, canEdit: boolean): ILessonItemModel {
    const { id, name, date, duration, delayedDate, note, semesterId, lessonGroupId, departmentId, teacherLessons, studentGroupLessons, visibility, } = entity;
    return {
      id, name, date, duration, delayedDate, note, lessonGroupId, visibility, canEdit,
      semesterId: semesterId ?? null,
      departmentId: departmentId ?? null,
      teacherIds: (teacherLessons ?? []).map((teacherLesson) => teacherLesson.teacherId),
      studentGroupIds: (studentGroupLessons ?? []).map((studentGroupLesson) => studentGroupLesson.studentGroupId),
    };
  }
}
