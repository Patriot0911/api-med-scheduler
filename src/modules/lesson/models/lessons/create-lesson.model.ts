import { LessonVisibility } from '../lesson-visibility.enum';

export interface ICreateLessonModel {
  name: string;
  date: Date;
  duration: number;
  semesterId: string;
  lessonGroupId?: string;
  note?: string;
  // optional; non-admins may set only their own department
  departmentId?: string | null;
  // owner of the lesson; defaults to the acting teacher
  ownerTeacherId?: string;
  // co-teachers (the owner is added automatically)
  teacherIds: string[];
  // co-teachers allowed to edit the lesson, a subset of teacherIds
  editorTeacherIds?: string[];
  studentGroupIds: string[];
  visibility?: LessonVisibility;
};
