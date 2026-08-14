import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { IGetLessonGroupsFiltersModel } from '../../models/lesson-groups/get-lesson-groups-filter.model';
import { Type } from 'class-transformer';

export class GetLessonGroupsRequestDto implements IGetLessonGroupsFiltersModel {
  @ApiProperty({ required: false, default: 1 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page: number;

  @ApiProperty({ required: false, default: 10 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  pageSize: number;

  @ApiPropertyOptional({ type: 'string', description: 'Search string' })
  @IsOptional()
  @IsString()
  search?: string;
}
