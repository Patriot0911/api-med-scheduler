import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { ISetDepartmentHeadModel } from '../models/set-department-head.model';

export class SetDepartmentHeadRequestDto implements ISetDepartmentHeadModel {
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Teacher id (must belong to this department). Pass null to unset the head.',
  })
  @IsOptional()
  @IsUUID()
  teacherId: string | null;
}
