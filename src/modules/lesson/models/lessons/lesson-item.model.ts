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
  departmentId: string | null;
  ownerTeacherId: string | null;
  // all teachers of the lesson, including the owner
  teacherIds: string[];
  // co-teachers allowed to edit the lesson
  editorTeacherIds: string[];
  studentGroupIds: string[];
  visibility: LessonVisibility;
};
