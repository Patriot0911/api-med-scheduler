import { LessonVisibility } from '../lesson-visibility.enum';

export interface ICreateLessonModel {
  name: string;
  date: Date;
  duration: number;
  semesterId: string;
  lessonGroupId?: string;
  note?: string;
  departmentId?: string | null;
  teacherIds: string[];
  studentGroupIds: string[];
  visibility?: LessonVisibility;
};
