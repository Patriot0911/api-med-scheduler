import { LessonVisibility } from '../lesson-visibility.enum';

export interface ICreateLessonGroupWithLessonsModel {
  name: string;
  note?: string;
  date: Date;
  duration: number;
  semesterId: string;
  teacherIds: string[];
  studentGroupIds: string[];
  intervalDays?: number;
  repeatCount?: number;
  dates?: Date[];
  visibility?: LessonVisibility;
};
