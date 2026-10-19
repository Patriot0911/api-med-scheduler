import { LessonVisibility } from '../lesson-visibility.enum';

export interface ILessonsFiltersModel {
  dateTo?: string;
  dateFrom?: string;
  teacherId?: string;
  studentGroupId?: string;
  departmentId?: string;
  // narrows the lessons the reader may see anyway; never widens them
  visibility?: LessonVisibility;
};
