import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";
import { IEditMeModel } from "../models/edit-me.model";

export class EditMeDto implements IEditMeModel {
  @ApiProperty({ example: 'example_email@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(1)
  fullName: string;
}
