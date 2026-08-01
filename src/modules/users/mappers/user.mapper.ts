import { Injectable } from '@nestjs/common';
import { UserEntity } from '../entities/user.entity';
import { IUserItemModel } from '../models/user-item.model';
import { IUserListItemModel } from '../models/user-list-item.model';

@Injectable()
export class UsersMapper {
  entityToListItem(user: UserEntity): IUserListItemModel {
    return this.entityToItem(user);
  }

  entityToItem(user: UserEntity): IUserItemModel {
    const { id, email, fullName, roles, createdAt, lastLoginAt, } = user;
    return {
      id, email, fullName, createdAt,
      lastLoginAt: lastLoginAt ?? null,
      roleIds: (roles ?? []).map((role) => role.id),
    };
  }
}
