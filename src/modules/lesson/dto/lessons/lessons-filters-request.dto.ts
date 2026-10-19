import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsOptional, IsUUID } from "class-validator";
import { ILessonsFiltersModel } from '../../models/lessons/lessons-filters.model';
import { LessonVisibility } from '../../models/lesson-visibility.enum';

export class LessonsFiltersRequestDto implements ILessonsFiltersModel {
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ type: 'string', description: 'Teacher id (from /dictionaries/teachers)' })
  teacherId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ type: 'string', description: 'Student group id (from /dictionaries/group)' })
  studentGroupId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ type: 'string', description: 'Lessons of this department' })
  departmentId?: string;

  @IsOptional()
  @IsEnum(LessonVisibility)
  @ApiPropertyOptional({
    enum: LessonVisibility,
    description: 'Only lessons with this visibility, among the ones the user may see (anonymous users see public lessons only)',
  })
  visibility?: LessonVisibility;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dateTo?: string;
}
