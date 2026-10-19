import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, Max, Min } from "class-validator";
import { IGetLessonsFiltersModel } from '../../models/lessons/get-lessons-filter.model';
import { Type } from 'class-transformer';
import { LessonsFiltersRequestDto } from './lessons-filters-request.dto';

export class GetLessonsRequestDto extends LessonsFiltersRequestDto implements IGetLessonsFiltersModel {
  @ApiPropertyOptional({ description: 'Together with pageSize; without them the whole list is returned, ordered by date' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  pageSize?: number;
}
