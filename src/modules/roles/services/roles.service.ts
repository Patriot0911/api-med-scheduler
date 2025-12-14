import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { RoleEntity } from '../entities/role.entity';
import { Permission } from '../../../shared/models/permission.enum';
import { ICreateRoleModel } from '../models/create-role.model';
import { RolesMapper } from '../mappers/roles.mapper';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { IRoleItemModel } from '../models/role-item.model';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { IRoleListItemModel } from '../models/role-list-item.model';
import { IGetRolesFiltersModel } from '../models/get-roles-filters.model';

@Injectable()
export class RolesService {
  constructor(
    private readonly rolesMapper: RolesMapper,
    @InjectRepository(RoleEntity)
    private rolesRepository: Repository<RoleEntity>,
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {}

  async getRolesDictionary() {
    const roles = await this.rolesRepository.find({
      select: ['id', 'name',]
    });
    return roles.map(
      (r) => this.rolesMapper.entityToDictionaryItem(r)
    );
  }

  async getAll(params: IGetRolesFiltersModel): Promise<IGenericListPayloadResponse<IRoleListItemModel>> {
    const { page, pageSize, search, } = params;
    const rolesQb = this.rolesRepository
      .createQueryBuilder('roles')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (search) {
      rolesQb.andWhere('roles.name LIKE :search', { search, });
    }

    const [rolesData, total] = await rolesQb.getManyAndCount();

    return {
      items: rolesData.map(
        (r) => this.rolesMapper.entityToListItem(r)
      ),
      meta: { count: total, },
    };
  }

  async getById(id: string) {
    const role = await this.rolesRepository.findOneOrFail({
      where: { id, }
    });
    return this.rolesMapper.entityToItem(role);
  }

  async createRole(roleData: ICreateRoleModel, userId: string): Promise<IRoleItemModel> {
    const userData = await this.usersRepository.findOneOrFail({
      where: { id: userId, }
    });
    await this.checkUserRoleManageAccess(roleData.permissions, userData);
    const newRole = this.rolesRepository.create({
      name: roleData.name,
      permissions: roleData.permissions,
      rolePriority: roleData.rolePriority,
    },);
    const createdRole = await this.rolesRepository.save(newRole);
    return this.rolesMapper.entityToItem(createdRole);
  }

  async editRole(roleData: ICreateRoleModel, roleId: string, userId: string): Promise<boolean> {
    const currentRoleData = await this.rolesRepository.findOneOrFail({
      where: { id: roleId, },
      select: ['permissions', 'rolePriority'],
    });

    const userRole = await this.rolesRepository.findOneOrFail({
      where: {
        rolePriority: MoreThan(currentRoleData.rolePriority),
        users: [
          { id: userId, },
        ],
      },
      order: {
        rolePriority: 'DESC',
      },
    });

    if (roleData.rolePriority && userRole.rolePriority <= roleData.rolePriority) {
      throw new ForbiddenException('Cannot edit role for higher prioirty');
    }

    const userData = await this.usersRepository.findOneOrFail({
      where: { id: userId, }
    });

    await this.checkUserRoleManageAccess(currentRoleData.permissions, userData);
    await this.checkUserRoleManageAccess(roleData.permissions, userData);

    const updatedRole = await this.rolesRepository.update(
      { id: roleId, },
      {
        name: roleData.name,
        permissions: roleData.permissions,
        rolePriority: roleData.rolePriority,
      },
    );
    return !!updatedRole.affected;
  }

  async deleteRole(roleId: string, userId: string): Promise<IRoleItemModel> {
    const roleData = await this.rolesRepository.findOneOrFail({
      where: { id: roleId, }
    });
    await this.rolesRepository.findOneOrFail({
      where: {
        rolePriority: MoreThan(roleData.rolePriority),
        users: [
          { id: userId, },
        ],
      },
      order: {
        rolePriority: 'DESC',
      },
    });
    const removedRole = await this.rolesRepository.remove(roleData);
    return this.rolesMapper.entityToItem(removedRole);
  }

  async checkUserRoleManageAccess(permissions: Permission[], userData: UserEntity): Promise<boolean> {
    const userAccess = this.rolesMapper.rolesToAccess(userData?.roles ?? []);
    if (
      !userAccess.permissions.includes(Permission.ADMIN) &&
      permissions.some((permission) => !userAccess.permissions.includes(permission))
    ) throw new ForbiddenException('Cannot performe action with not owned permission or without admin access');
    return true;
  }
}
