import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, MinLength } from "class-validator";
import { IEditLessonGroupModel } from '../../models/lesson-groups/edit-lesson-group.model';

export class EditLessonGroupRequestDto implements IEditLessonGroupModel {
  @ApiProperty({ example: 'Анатомія, лекція' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  note?: string;
}
