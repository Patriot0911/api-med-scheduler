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
    const { id, name, date, duration, delayedDate, note, semesterId, lessonGroupId, departmentId, teacherLessons, studentGroupLessons, visibility, } = entity;
    const teachers = teacherLessons ?? [];
    return {
      id, name, date, duration, delayedDate, note, lessonGroupId, visibility,
      semesterId: semesterId ?? null,
      departmentId: departmentId ?? null,
      ownerTeacherId: teachers.find((teacherLesson) => teacherLesson.isOwner)?.teacherId ?? null,
      teacherIds: teachers.map((teacherLesson) => teacherLesson.teacherId),
      editorTeacherIds: teachers
        .filter((teacherLesson) => teacherLesson.canEdit && !teacherLesson.isOwner)
        .map((teacherLesson) => teacherLesson.teacherId),
      studentGroupIds: (studentGroupLessons ?? []).map((studentGroupLesson) => studentGroupLesson.studentGroupId),
    };
  }
}
