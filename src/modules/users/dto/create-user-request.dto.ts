import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { IsArray, IsEmail, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { ICreateUserModel } from "../models/create-user.model";
import { CreateTeacherProfileRequestDto } from './create-teacher-profile-request.dto';
import { CreateStudentProfileRequestDto } from './create-student-profile-request.dto';

export class CreateUserRequestDto implements ICreateUserModel {
  @ApiProperty({ example: 'example_email@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(1)
  fullName: string;

  @ApiPropertyOptional({ example: 'initial_password', description: 'Initial password. Omit to generate a random one; the user then sets their own via a password reset link.' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;

  @ApiPropertyOptional({ type: [String], description: 'Role ids to assign to the new user' })
  @IsOptional()
  @IsArray()
  roleIds?: string[];

  @ApiPropertyOptional({
    type: CreateTeacherProfileRequestDto,
    nullable: true,
    description: 'Provide to also create a teacher profile for this user. A user can be created with no profile at all.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateTeacherProfileRequestDto)
  teacher?: CreateTeacherProfileRequestDto | null;

  @ApiPropertyOptional({
    type: CreateStudentProfileRequestDto,
    nullable: true,
    description: 'Provide to also create a student profile for this user. A user can be created with no profile at all.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateStudentProfileRequestDto)
  student?: CreateStudentProfileRequestDto | null;
}
