import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { Permission } from 'src/shared/models/permission.enum';
import { RoleEntity } from '../entities/role.entity';
import { IAuthorityModel } from '../models/authority.model';

/** Rank of a user without roles: below any role, priority 0 included */
export const NO_RANK = -1;

type TRoleAuthority = Pick<RoleEntity, 'permissions' | 'rolePriority'>;

/**
 * Role hierarchy (rank = the highest priority among the user's roles):
 * - a user may manage only other users ranked strictly below them;
 * - a role may be managed (created, edited, deleted, granted, taken away) only when it is ranked below
 *   the actor and holds no permissions the actor lacks; admin is exempt from the permissions part only.
 */
@Injectable()
export class AuthorityService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {}

  async getAuthority(userId: string): Promise<IAuthorityModel> {
    const user = await this.usersRepository.findOne({
      where: { id: userId, },
      relations: { roles: true, },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.fromRoles(user.id, user.roles);
  }

  fromRoles(userId: string, roles: TRoleAuthority[]): IAuthorityModel {
    const permissions = [...new Set(roles.flatMap((role) => role.permissions))];
    return {
      userId,
      permissions,
      rank: Math.max(NO_RANK, ...roles.map((role) => role.rolePriority)),
      isAdmin: permissions.includes(Permission.ADMIN),
    };
  }

  canManageUser(actor: IAuthorityModel, target: Pick<IAuthorityModel, 'userId' | 'rank'>): boolean {
    return actor.userId !== target.userId && actor.rank > target.rank;
  }

  canManageRole(actor: IAuthorityModel, role: TRoleAuthority): boolean {
    return actor.rank > role.rolePriority
      && (actor.isAdmin || role.permissions.every((permission) => actor.permissions.includes(permission)));
  }

  assertCanManageUser(actor: IAuthorityModel, target: Pick<IAuthorityModel, 'userId' | 'rank'>): void {
    if (!this.canManageUser(actor, target)) {
      throw new ForbiddenException('You can only manage users ranked below you');
    }
  }

  assertCanManageRoles(actor: IAuthorityModel, roles: TRoleAuthority[]): void {
    if (roles.some((role) => !this.canManageRole(actor, role))) {
      throw new ForbiddenException('You can only manage roles ranked below you and holding only permissions you have');
    }
  }
}
