import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { IGetMyLessonsFiltersModel } from '../../models/lessons/get-my-lessons-filter.model';
import { LessonScope } from '../../models/lesson-scope.enum';
import { GetLessonsRequestDto } from './get-lessons-request.dto';

export class GetMyLessonsRequestDto extends GetLessonsRequestDto implements IGetMyLessonsFiltersModel {
  @IsOptional()
  @IsEnum(LessonScope)
  @ApiPropertyOptional({
    enum: LessonScope,
    description: 'teaching: I am a lesson teacher; department: lessons of the department I head; studying: lessons of my group. Without it: teaching and studying',
  })
  scope?: LessonScope;
}
