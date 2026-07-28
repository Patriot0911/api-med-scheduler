import { ILessonGroupItemModel } from './lesson-group-item.model';
import { ILessonItemModel } from '../lessons/lesson-item.model';

export interface ILessonGroupWithLessonsModel {
  lessonGroup: ILessonGroupItemModel;
  lessons: ILessonItemModel[];
};
