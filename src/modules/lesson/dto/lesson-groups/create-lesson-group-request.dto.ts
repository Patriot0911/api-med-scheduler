import { ICreateLessonGroupModel } from '../../models/lesson-groups/create-lesson-group.model';
import { EditLessonGroupRequestDto } from './edit-lesson-group-request.dto';

export class CreateLessonGroupRequestDto extends EditLessonGroupRequestDto implements ICreateLessonGroupModel {}
