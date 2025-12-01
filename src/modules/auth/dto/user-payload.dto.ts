import { ApiProperty } from "@nestjs/swagger";
import type { IUserPayload } from "../models/user-payload.model";
import { Permission } from "src/shared/models/permission.enum";

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
}
