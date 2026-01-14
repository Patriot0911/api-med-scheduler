import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, } from "class-validator";
import { IEditTagGroupsModel } from '../models/edit-tag-groups.model';

export class EditTagGroupsRequestDto implements IEditTagGroupsModel {
  @ApiProperty({ example: ['dddd-ffff-eeee-wwww'] })
  @IsArray()
  @IsNotEmpty()
  groups: string[];
}
