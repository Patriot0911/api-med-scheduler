import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";
import { IResetPasswordModel } from "src/modules/users/models/reset-password.model";

export class ResetPasswordDto implements IResetPasswordModel {
  @ApiProperty({ description: 'Password reset token' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'example_password' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
