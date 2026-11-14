import { ICreateLessonModel } from '../lessons/create-lesson.model';
import { IEditLessonGroupModel } from './edit-lesson-group.model';

/** Everything of a lesson but its date and group: the same for every lesson of a series */
export type TLessonTemplateModel = Omit<ICreateLessonModel, 'date' | 'lessonGroupId'>;

/** A new group with a lesson at each of the dates; the client builds the dates from its recurrence rule */
export interface ICreateLessonGroupWithLessonsModel {
  lessonGroup: IEditLessonGroupModel;
  lesson: TLessonTemplateModel;
  dates: Date[];
};

/** Lessons added to an existing group at each of the dates */
export type IAddLessonsToGroupModel = Omit<ICreateLessonGroupWithLessonsModel, 'lessonGroup'>;
