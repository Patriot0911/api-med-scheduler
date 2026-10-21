import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsUUID } from 'class-validator';
import { ISetDepartmentTeachersModel } from '../models/set-department-teachers.model';

export class SetDepartmentTeachersRequestDto implements ISetDepartmentTeachersModel {
  @ApiProperty({
    type: [String],
    description: 'Full list of the department teachers. Teachers of other departments are moved here, missing ones are detached.',
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true, })
  teacherIds: string[];
}
