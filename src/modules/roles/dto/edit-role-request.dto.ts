import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Max, Min, MinLength } from "class-validator";
import { Permission } from "../../../shared/models/permission.enum";
import { IEditRoleModel } from "../models/edit-role.model";

export class EditRoleRequestDto implements IEditRoleModel {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({ example: [Permission.ADMIN] })
  @IsArray()
  @IsEnum(Permission, { each: true })
  permissions: Permission[];

  @ApiProperty({ example: 0, })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(256)
  rolePriority: number | undefined = 1;
}
