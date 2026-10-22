import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";
import { IGetUsersFiltersModel } from "../models/get-users-filters.model";
import { Transform, Type } from 'class-transformer';
import { UserProfileType } from '../models/user-profile-type.enum';

// a single query value (?profiles=student) comes as a string, repeated ones as an array
const toArray = ({ value }: { value: unknown }): unknown[] => (Array.isArray(value) ? (value as unknown[]) : [value]);

export class GetUsersRequestDto implements IGetUsersFiltersModel {
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
  @Transform(toArray)
  @IsArray()
  @IsUUID('all', { each: true, })
  @ApiPropertyOptional({ type: [String], description: 'Users with any of these roles' })
  roleIds?: string[];

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsEnum(UserProfileType, { each: true, })
  @ApiPropertyOptional({ enum: UserProfileType, isArray: true, description: 'Users with any of these profiles' })
  profiles?: UserProfileType[];
}
