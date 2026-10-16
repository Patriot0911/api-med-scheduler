import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { IEditDepartmentModel } from '../models/edit-department.model';

export class EditDepartmentRequestDto implements IEditDepartmentModel {
  @ApiProperty({ example: 'Кафедра внутрішньої медицини' })
  @IsString()
  @MinLength(2)
  name: string;
}
