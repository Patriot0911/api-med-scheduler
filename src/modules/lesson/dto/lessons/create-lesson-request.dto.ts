import { ICreateLessonModel } from '../../models/lessons/create-lesson.model';
import { EditLessonRequestDto } from './edit-lesson-request.dto';

export class CreateLessonRequestDto extends EditLessonRequestDto implements ICreateLessonModel {
}
 