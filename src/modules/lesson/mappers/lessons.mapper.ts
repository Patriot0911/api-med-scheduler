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
    const {
      id, name, date, duration, note, semesterId, lessonGroupId,
      teacherLessons, studentGroupLessons, lessonDepartments, visibility, lessonGroup,
    } = entity;
    return {
      id, name, date, duration, note, visibility, canEdit,
      lessonGroupId: lessonGroupId ?? null,
      semesterId: semesterId ?? null,
      teacherIds: (teacherLessons ?? []).map((teacherLesson) => teacherLesson.teacherId),
      studentGroupIds: (studentGroupLessons ?? []).map((studentGroupLesson) => studentGroupLesson.studentGroupId),
      lessonGroupName: lessonGroup?.name ?? null,
      teachers: (teacherLessons ?? []).map((teacherLesson) => ({
        id: teacherLesson.teacherId,
        name: teacherLesson.teacher?.user?.fullName ?? '',
      })),
      departmentIds: (lessonDepartments ?? []).map((lessonDepartment) => lessonDepartment.departmentId),
      departments: (lessonDepartments ?? []).map((lessonDepartment) => ({
        id: lessonDepartment.departmentId,
        name: lessonDepartment.department?.name ?? '',
      })),
      studentGroups: (studentGroupLessons ?? []).map((studentGroupLesson) => ({
        id: studentGroupLesson.studentGroupId,
        name: studentGroupLesson.studentGroup?.name ?? '',
      })),
    };
  }
}
