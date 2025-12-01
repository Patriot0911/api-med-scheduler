import { Injectable } from '@nestjs/common';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { IUserPayload } from '../models/user-payload.model';
import { RolesMapper } from 'src/modules/roles/mappers/roles.mapper';
import { IAuthResponse } from '../models/auth-response.model';
import { ITokenModel } from '../models/token.model';

@Injectable()
export class AuthMapper {
  constructor(
    private readonly rolesMapper: RolesMapper,
  ) {};

  userEntityToUserPayload(user: UserEntity): IUserPayload {
    const { email, fullName, id, roles, } = user;
    const { permissions, roles: accessRoles, } = this.rolesMapper.rolesToAccess(roles ?? []);
    return {
      email,
      fullName,
      id,
      permissions,
      roles: accessRoles,
    };
  }

  entitiesToAuth(tokens: ITokenModel, user: UserEntity): IAuthResponse {
    return {
      tokens,
      user: this.userEntityToUserPayload(user),
    };
  }
}
