import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";
import { IRegisterModel } from "../models/register.model";

export class RegistrationDto implements IRegisterModel {
  @ApiProperty({ example: 'example_email@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'example_password' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName: string;
}
