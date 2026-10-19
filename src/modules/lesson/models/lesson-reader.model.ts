/** Who reads lessons: decides which lessons they see. */
export interface ILessonReaderModel {
  // anonymous readers see public lessons only
  isAuthenticated: boolean;
  // admin / manage_lessons: every lesson
  seesAll: boolean;
  teacherId: string | null;
  departmentId: string | null;
  studentGroupId: string | null;
};
