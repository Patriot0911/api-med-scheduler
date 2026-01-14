import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";
import { IEditTagModel } from '../models/edit-tag.model';

export class EditTagRequestDto implements IEditTagModel {
  @ApiProperty({ example: 'очне / педіатрія / тощо' })
  @IsString()
  @MinLength(3)
  name: string;
}
