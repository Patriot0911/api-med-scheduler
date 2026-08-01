import { ApiProperty } from "@nestjs/swagger";
import type { IUserPayload } from "../models/user-payload.model";
import { Permission } from "src/shared/models/permission.enum";
import { ITeacherProfileModel } from "src/modules/users/models/teacher-profile.model";
import { IStudentProfileModel } from "src/modules/users/models/student-profile.model";

export class UserPayloadDto implements IUserPayload {
  @ApiProperty({ type: 'string', })
  id: string;

  @ApiProperty({ type: 'string', example: 'example@gmail.com' })
  email: string;

  @ApiProperty({ type: 'string', example: 'Cillian Murphy', })
  fullName: string;

  @ApiProperty({ enum: Permission, isArray: true, })
  permissions: Permission[];

  @ApiProperty({ type: [String], })
  roles: string[];

  @ApiProperty({
    nullable: true,
    example: { id: 'uuid' },
    description: 'Present if this user has a teacher profile',
  })
  teacher: ITeacherProfileModel | null;

  @ApiProperty({
    nullable: true,
    example: { id: 'uuid', studentGroupId: 'uuid', isGroupMonitor: false },
    description: 'Present if this user has a student profile',
  })
  student: IStudentProfileModel | null;
}
