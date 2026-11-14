import { LessonVisibility } from '../lesson-visibility.enum';

/** Each array filter matches any of its values; different filters combine with AND */
export interface ILessonsFiltersModel {
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  teacherIds?: string[];
  studentGroupIds?: string[];
  groupTagIds?: string[];
  departmentIds?: string[];
  lessonGroupIds?: string[];
  withoutLessonGroup?: boolean;
  semesterIds?: string[];
  // narrows the lessons the reader may see anyway; never widens them
  visibility?: LessonVisibility;
};
