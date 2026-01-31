import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
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
  @ApiPropertyOptional({ type: 'string', description: 'Teacher`s name' })
  teacher?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: 'string', description: 'Group`s name', example: 'XX-123' })
  group?: string;

  @ApiProperty({ required: false})
  @IsDateString()
  @IsOptional()
  dateFrom?: Date;

  @ApiProperty({ required: false})
  @IsDateString()
  @IsOptional()
  dateTo?: Date;
}
