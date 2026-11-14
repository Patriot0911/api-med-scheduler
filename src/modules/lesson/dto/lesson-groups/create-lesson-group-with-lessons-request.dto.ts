import { ApiProperty, OmitType } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsDate, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IAddLessonsToGroupModel, ICreateLessonGroupWithLessonsModel } from '../../models/lesson-groups/create-lesson-group-with-lessons.model';
import { CreateLessonRequestDto } from '../lessons/create-lesson-request.dto';
import { EditLessonGroupRequestDto } from './edit-lesson-group-request.dto';

export class LessonTemplateRequestDto extends OmitType(CreateLessonRequestDto, ['date', 'lessonGroupId'] as const) {
}

export class CreateLessonGroupWithLessonsRequestDto implements ICreateLessonGroupWithLessonsModel {
  @ApiProperty({ type: EditLessonGroupRequestDto, description: 'The new group of the series' })
  @ValidateNested()
  @Type(() => EditLessonGroupRequestDto)
  lessonGroup: EditLessonGroupRequestDto;

  @ApiProperty({ type: LessonTemplateRequestDto, description: 'Fields of every lesson in the series, as in POST /lessons without date and group' })
  @ValidateNested()
  @Type(() => LessonTemplateRequestDto)
  lesson: LessonTemplateRequestDto;

  @ApiProperty({
    type: [Date],
    example: ['2026-02-07T10:00:00Z', '2026-02-14T10:00:00Z'],
    description: 'Start of each lesson (ISO 8601), 1–200; duplicates are dropped',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @Type(() => Date)
  @IsDate({ each: true, })
  dates: Date[];
}

export class AddLessonsToGroupRequestDto extends OmitType(CreateLessonGroupWithLessonsRequestDto, ['lessonGroup'] as const) implements IAddLessonsToGroupModel {
}
