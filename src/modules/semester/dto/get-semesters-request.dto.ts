import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IGetSemestersFiltersModel } from "../models/get-semesters-filters-model";
import { IsDate, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class GetSemestersRequestDto implements IGetSemestersFiltersModel {
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
  @IsDate()
  @ApiPropertyOptional({ type: Date, description: 'Semesters from' })
  dateFrom?: Date | undefined;

  @IsOptional()
  @IsDate()
  @ApiPropertyOptional({ type: Date, description: 'Semesters to' })
  dateTo?: Date | undefined;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: 'string', description: 'Search string' })
  search?: string;
}
