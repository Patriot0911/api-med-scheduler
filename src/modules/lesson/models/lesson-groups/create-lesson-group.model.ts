import { IEditLessonGroupModel } from './edit-lesson-group.model';

export interface ICreateLessonGroupModel extends IEditLessonGroupModel {
  // optional; non-admins may set only their own department
  departmentId?: string | null;
};
