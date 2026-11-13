/** How a lesson relates to the requesting user, for /lessons/my */
export enum LessonScope {
  // the user is one of the lesson teachers
  TEACHING = 'teaching',
  // the lesson belongs to the department the user heads
  DEPARTMENT = 'department',
  // the lesson is held for the user's student group
  STUDYING = 'studying',
}
