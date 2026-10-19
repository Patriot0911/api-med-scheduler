import { TeacherEntity } from 'src/modules/users/entities/teacher.entity';

export enum LessonManageScopeKind {
  // admin / manage_lessons: any lesson, any group, any department
  ALL = 'all',
  // a teacher: lessons they own or were allowed to edit by the owner
  TEACHER = 'teacher',
};

export interface ILessonManageScopeModel {
  kind: LessonManageScopeKind;
  teacher: TeacherEntity | null;
};
