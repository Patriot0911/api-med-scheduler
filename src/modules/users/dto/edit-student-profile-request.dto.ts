import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsUUID } from "class-validator";
import { IEditStudentProfileModel } from '../models/edit-student-profile.model';

export class EditStudentProfileRequestDto implements IEditStudentProfileModel {
  @ApiPropertyOptional({ nullable: true, description: 'Student group id to assign the student to. Pass null to detach.' })
  @IsOptional()
  @IsUUID()
  studentGroupId?: string | null;

  @ApiPropertyOptional({ default: false, description: 'Whether this student is the group monitor (староста)' })
  @IsOptional()
  @IsBoolean()
  isGroupMonitor?: boolean;
}
