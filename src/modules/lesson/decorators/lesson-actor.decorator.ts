import { CurrentUser } from 'src/modules/auth/decorator/current-user.decorator';
import { ResolveLessonActorPipe } from '../pipes/resolve-lesson-actor.pipe';

/** The current user as a lesson actor; anonymous with OptionalJwtAccessGuard and no token */
export const LessonActor = () => CurrentUser(ResolveLessonActorPipe);
