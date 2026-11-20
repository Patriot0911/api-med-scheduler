import { ILessonGroupListItemModel } from './lesson-group-list-item.model';

export interface IUsableLessonGroupListItemModel extends ILessonGroupListItemModel {
  canManageLessons: boolean;
}
