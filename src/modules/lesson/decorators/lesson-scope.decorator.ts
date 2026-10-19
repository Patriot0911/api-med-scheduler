import { CurrentUser } from 'src/modules/auth/decorator/current-user.decorator';
import { ResolveLessonScopePipe } from '../pipes/resolve-lesson-scope.pipe';

/**
 * Injects the current user's lesson management scope (ALL / TEACHER).
 * Throws 403 if the user is neither admin / manage_lessons nor a teacher.
 */
export const LessonScope = () => CurrentUser(ResolveLessonScopePipe);
