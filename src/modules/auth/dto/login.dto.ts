import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";
import { ILoginModel } from "../models/login.model";

export class LoginDto implements ILoginModel {
  @ApiProperty({ example: 'example_email@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'example_password' })
  @IsString()
  @MinLength(8)
  password: string;
}
