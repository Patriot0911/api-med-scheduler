import { ILessonGroupItemModel } from './lesson-group-item.model';

export interface ILessonGroupListItemModel extends ILessonGroupItemModel {
  departmentName: string | null;
  createdByTeacherName: string | null;
  lessonsCount: number;
  // by the effective lesson dates (a moved lesson counts at its new date)
  firstLessonDate: Date | null;
  lastLessonDate: Date | null;
}
