import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsUUID } from "class-validator";
import { IEditTeacherProfileModel } from '../models/edit-teacher-profile.model';

export class EditTeacherProfileRequestDto implements IEditTeacherProfileModel {
  @ApiPropertyOptional({ nullable: true, description: 'Department (кафедра) id to assign the teacher to. Pass null to detach.' })
  @IsOptional()
  @IsUUID()
  departmentId?: string | null;
}
