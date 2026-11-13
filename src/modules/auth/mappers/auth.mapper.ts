import { Injectable } from '@nestjs/common';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { IUserPayload } from '../models/user-payload.model';
import { RolesMapper } from 'src/modules/roles/mappers/roles.mapper';
import { UsersMapper } from 'src/modules/users/mappers/user.mapper';
import { IAuthResponse } from '../models/auth-response.model';
import { ITokenModel } from '../models/token.model';

@Injectable()
export class AuthMapper {
  constructor(
    private readonly rolesMapper: RolesMapper,
    private readonly usersMapper: UsersMapper,
  ) {};

  userEntityToUserPayload(user: UserEntity): IUserPayload {
    const { email, fullName, id, roles, teacher, student, } = user;
    const { permissions, roles: accessRoles, } = this.rolesMapper.rolesToAccess(roles ?? []);
    return {
      email,
      fullName,
      id,
      permissions,
      roles: accessRoles,
      teacher: teacher
        ? { ...this.usersMapper.teacherProfileToItem(teacher), headOfDepartmentId: teacher.headedDepartment?.id ?? null, }
        : null,
      student: student ? this.usersMapper.studentProfileToItem(student) : null,
    };
  }

  entitiesToAuth(tokens: ITokenModel, user: UserEntity): IAuthResponse {
    return {
      tokens,
      user: this.userEntityToUserPayload(user),
    };
  }
}
