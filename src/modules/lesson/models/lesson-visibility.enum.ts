export enum LessonVisibility {
  // anyone, anonymous visitors of the public schedule included
  ALL = 'all',
  // the lesson teachers, the head of the lesson's department and students of its groups; 404 for anyone else
  INVOLVED = 'involved',
}
