import { TeacherEntity } from 'src/modules/users/entities/teacher.entity';

export enum LessonManageScopeKind {
  // admin / manage_lessons: any lesson, any group
  ALL = 'all',
  // manage_department_lessons: lessons of any teacher from own department
  DEPARTMENT = 'department',
  // manage_own_lessons: lessons where the actor is one of the teachers
  OWN = 'own',
};

export interface ILessonManageScopeModel {
  kind: LessonManageScopeKind;
  teacher: TeacherEntity | null;
};
