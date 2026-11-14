import { LessonVisibility } from '../lesson-visibility.enum';
import { ILessonRefModel } from './lesson-ref.model';

export interface ILessonItemModel {
  id: string;
  name: string;
  date: Date;
  duration: number;
  delayedDate: Date | null;
  note: string | null;
  semesterId: string | null;
  lessonGroupId: string | null;
  departmentIds: string[];
  teacherIds: string[];
  studentGroupIds: string[];
  // names for display, so clients (anonymous ones included) need no dictionaries
  lessonGroupName: string | null;
  departments: ILessonRefModel[];
  teachers: ILessonRefModel[];
  studentGroups: ILessonRefModel[];
  visibility: LessonVisibility;
  /** Whether the requesting user may edit / delete the lesson */
  canEdit: boolean;
};
