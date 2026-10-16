import { CurrentUser } from 'src/modules/auth/decorator/current-user.decorator';
import { ResolveLessonScopePipe } from '../pipes/resolve-lesson-scope.pipe';

/**
 * Injects the current user's lesson management scope (ALL / DEPARTMENT / OWN).
 * Throws 403 if the user has no lesson management permission.
 */
export const LessonScope = () => CurrentUser(ResolveLessonScopePipe);
