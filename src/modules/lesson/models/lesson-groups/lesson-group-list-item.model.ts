import { ILessonGroupItemModel } from './lesson-group-item.model';

export interface ILessonGroupListItemModel extends ILessonGroupItemModel {
  departmentName: string | null;
  createdByTeacherName: string | null;
  lessonsCount: number;
  firstLessonDate: Date | null;
  lastLessonDate: Date | null;
}
