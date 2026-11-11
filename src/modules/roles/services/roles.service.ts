import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
      rolesQb.andWhere('roles.name ILIKE :search', { search: `%${search}%`, });
    }

    const [rolesData, total] = await rolesQb
      .distinct(true)
      .getManyAndCount();

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
    const actingUser = await this.getActingUser(userId);
    await this.checkUserRoleManageAccess(roleData.permissions, actingUser);
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

    const actingUser = await this.getActingUser(userId);

    this.assertOutranksRole(actingUser, currentRoleData.rolePriority);
    if (roleData.rolePriority !== undefined) {
      this.assertOutranksRole(actingUser, roleData.rolePriority);
    }

    await this.checkUserRoleManageAccess(currentRoleData.permissions, actingUser);
    await this.checkUserRoleManageAccess(roleData.permissions, actingUser);

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
    const actingUser = await this.getActingUser(userId);
    this.assertOutranksRole(actingUser, roleData.rolePriority);

    const removedRole = await this.rolesRepository.remove(roleData);
    return this.rolesMapper.entityToItem({ ...removedRole, id: roleId, });
  }

  private async getActingUser(userId: string): Promise<UserEntity> {
    return await this.usersRepository.findOneOrFail({
      where: { id: userId, },
      relations: { roles: true, },
    });
  }

  private assertOutranksRole(actingUser: UserEntity, rolePriority: number): void {
    const highestPriority = Math.max(-1, ...(actingUser.roles ?? []).map((role) => role.rolePriority));
    if (highestPriority <= rolePriority) {
      throw new ForbiddenException('Cannot manage a role with the same or higher priority than your own');
    }
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
