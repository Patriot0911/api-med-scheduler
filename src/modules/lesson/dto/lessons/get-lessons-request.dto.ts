import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { IGetLessonsFiltersModel } from '../../models/lessons/get-lessons-filter.model';
import { Type } from 'class-transformer';

export class GetLessonsRequestDto implements IGetLessonsFiltersModel {
  @ApiProperty({ required: false, default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page: number;

  @ApiProperty({ required: false, default: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
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
  dateFrom?: string;

  @ApiProperty({ required: false})
  @IsDateString()
  @IsOptional()
  dateTo?: string;
}
