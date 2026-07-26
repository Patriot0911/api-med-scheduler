import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { IGetLessonGroupsFiltersModel } from '../../models/lesson-groups/get-lesson-groups-filter.model';

export class GetLessonGroupsRequestDto implements IGetLessonGroupsFiltersModel {
  @ApiProperty({ required: false, default: 1 })
  @IsNumber()
  @Min(1)
  page: number;

  @ApiProperty({ required: false, default: 10 })
  @IsNumber()
  @Min(0)
  @Max(100)
  pageSize: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: 'string', description: 'Search string' })
  search?: string;
}
