/** The user acting in the teacher domain; every field is null for an anonymous visitor */
export interface ILessonActorModel {
  userId: string | null;
  teacherId: string | null;
  // the teacher's own department
  departmentId: string | null;
  // the department this teacher heads
  headOfDepartmentId: string | null;
  studentGroupId: string | null;
};
