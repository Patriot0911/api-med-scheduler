import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsEmail, IsOptional, IsString, IsUUID, MinLength } from "class-validator";
import { IEditUserModel } from "../models/edit-user.model";

export class EditUserRequestDto implements IEditUserModel {
  @ApiProperty({ example: 'example_email@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(1)
  fullName: string;

  @ApiPropertyOptional({ type: [String], description: 'Role ids of the user. Omit to keep the current roles.' })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true, })
  roleIds?: string[];
}
