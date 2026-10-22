import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";
import { IEditMeModel } from "../models/edit-me.model";

export class EditMeDto implements IEditMeModel {
  @ApiProperty({ example: 'example_email@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(1)
  fullName: string;

  @ApiPropertyOptional({ description: 'Required when the email changes' })
  @IsOptional()
  @IsString()
  currentPassword?: string;
}
