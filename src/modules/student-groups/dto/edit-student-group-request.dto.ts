import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString, MinLength } from "class-validator";
import { IEditStudentGroupModel } from "../models/edit-student-group.model";

export class EditStudentGroupRequestDto implements IEditStudentGroupModel {
  @ApiProperty({ example: 'IXXX-123' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({ example: ['ddd-www-ffff', 'qqq-eee-ttt-fff'], type: [String], })
  @IsArray()
  tagIds: string[];

  @ApiProperty({ example: '1 курс, Магістратура', })
  @IsString()
  @MinLength(1)
  studyYear: string;
}
