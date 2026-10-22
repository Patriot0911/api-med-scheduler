import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";
import { IChangePasswordModel } from "../models/change-password.model";

export class ChangePasswordDto implements IChangePasswordModel {
  @ApiProperty({ example: 'current_password' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'new_password' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword: string;
}
