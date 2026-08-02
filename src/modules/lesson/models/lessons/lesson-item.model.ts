import { LessonVisibility } from '../lesson-visibility.enum';

export interface ILessonItemModel {
  id: string;
  name: string;
  date: Date;
  duration: number;
  delayedDate: Date | null;
  note: string | null;
  semesterId: string | null;
  lessonGroupId: string;
  teacherIds: string[];
  studentGroupIds: string[];
  visibility: LessonVisibility;
};
