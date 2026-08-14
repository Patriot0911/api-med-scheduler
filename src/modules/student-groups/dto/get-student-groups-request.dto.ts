import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { IGetStudentGroupsFiltersModel } from "../models/get-student-groups-filters.model";
import { Type } from 'class-transformer';

export class GetStudentGroupsRequestDto implements IGetStudentGroupsFiltersModel {
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

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: 'string', description: 'Search string' })
  search?: string;

  @IsOptional()
  @IsArray()
  @ApiPropertyOptional({ type: 'array', description: 'tag of arrays' })
  tags?: string[];
}
