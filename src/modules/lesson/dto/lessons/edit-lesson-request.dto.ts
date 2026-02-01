import { PartialType } from '@nestjs/swagger';
import { IEditLessonModel } from '../../models/lessons/edit-lesson.model';
import { CreateLessonRequestDto } from './create-lesson-request.dto';

export class EditLessonRequestDto extends PartialType(CreateLessonRequestDto) implements IEditLessonModel {
}
