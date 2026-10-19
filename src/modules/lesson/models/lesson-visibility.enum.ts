export enum LessonVisibility {
  // anyone, including the public calendar
  PUBLIC = 'public',
  // any signed-in user
  AUTHENTICATED = 'authenticated',
  // the lesson's department acts as a tenant: its members, the lesson teachers and admin / manage_lessons;
  // for anyone else the lesson does not exist (404)
  DEPARTMENT = 'department',
}
