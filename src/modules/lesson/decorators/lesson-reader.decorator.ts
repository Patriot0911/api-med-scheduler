import { CurrentUser } from 'src/modules/auth/decorator/current-user.decorator';
import { ResolveLessonReaderPipe } from '../pipes/resolve-lesson-reader.pipe';

/**
 * Injects the current user as a lesson reader: which lessons they may see.
 * Works with JwtAccessGuard and OptionalJwtAccessGuard (anonymous reader).
 */
export const LessonReader = () => CurrentUser(ResolveLessonReaderPipe);
