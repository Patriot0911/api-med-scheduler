import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { IsArray, IsEmail, IsOptional, IsString, MinLength } from "class-validator";
import { ICreateUserModel } from "../models/create-user.model";

export class CreateUserRequestDto implements ICreateUserModel {
  @ApiProperty({ example: 'example_email@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(1)
  fullName: string;

  @ApiPropertyOptional({ type: [String], description: 'Role ids to assign to the new user' })
  @IsOptional()
  @IsArray()
  roleIds?: string[];
}
