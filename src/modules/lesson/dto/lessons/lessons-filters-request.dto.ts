import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsUUID } from "class-validator";
import { ILessonsFiltersModel } from '../../models/lessons/lessons-filters.model';

export class LessonsFiltersRequestDto implements ILessonsFiltersModel {
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ type: 'string', description: 'Teacher id (from /dictionaries/teachers)' })
  teacherId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ type: 'string', description: 'Student group id (from /dictionaries/group)' })
  studentGroupId?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dateTo?: string;
}
