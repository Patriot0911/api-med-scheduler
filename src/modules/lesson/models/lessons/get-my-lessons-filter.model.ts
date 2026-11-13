import { LessonScope } from '../lesson-scope.enum';
import { IGetLessonsFiltersModel } from './get-lessons-filter.model';

export interface IGetMyLessonsFiltersModel extends IGetLessonsFiltersModel {
  // without it: teaching and studying together
  scope?: LessonScope;
}
