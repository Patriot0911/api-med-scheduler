import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID } from 'class-validator';
import { ILessonIdsModel } from '../../models/lessons/lesson-ids.model';

export class LessonIdsRequestDto implements ILessonIdsModel {
  @ApiProperty({ type: [String], description: 'Lesson ids, 1–200; duplicates are ignored' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @IsUUID('all', { each: true, })
  lessonIds: string[];
}
