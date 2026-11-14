import { LessonVisibility } from '../lesson-visibility.enum';

export interface ICreateLessonModel {
  name: string;
  date: Date;
  duration: number;
  semesterId?: string | null;
  // optional: lessons of a series or lessons that belong together
  lessonGroupId?: string | null;
  note?: string;
  // the head of each of them may edit the lesson
  departmentIds?: string[];
  teacherIds: string[];
  studentGroupIds: string[];
  visibility?: LessonVisibility;
};
