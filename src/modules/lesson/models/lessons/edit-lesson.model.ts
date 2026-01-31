export interface IEditLessonModel {
  name: string;
  date: Date;
  duration: number;
  semesterId: string;
  lessonGroupId?: string;
  note?: string;
};
