import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, Max, Min } from "class-validator";
import { IGetLessonsFiltersModel } from '../../models/lessons/get-lessons-filter.model';
import { Type } from 'class-transformer';
import { LessonsFiltersRequestDto } from './lessons-filters-request.dto';

export class GetLessonsRequestDto extends LessonsFiltersRequestDto implements IGetLessonsFiltersModel {
  @ApiProperty({ required: false, default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number;

  @ApiProperty({ required: false, default: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  pageSize: number;
}
