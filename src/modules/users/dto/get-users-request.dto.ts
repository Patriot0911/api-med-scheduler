import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { IGetUsersFiltersModel } from "../models/get-users-filters.model";

export class GetUsersRequestDto implements IGetUsersFiltersModel {
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
