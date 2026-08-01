import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsUUID } from "class-validator";
import { IEditStudentProfileModel } from '../models/edit-student-profile.model';

export class EditStudentProfileRequestDto implements IEditStudentProfileModel {
  @ApiPropertyOptional({ description: 'Student group id to assign the student to' })
  @IsOptional()
  @IsUUID()
  studentGroupId?: string;

  @ApiPropertyOptional({ default: false, description: 'Whether this student is the group monitor (староста)' })
  @IsOptional()
  @IsBoolean()
  isGroupMonitor?: boolean;
}
