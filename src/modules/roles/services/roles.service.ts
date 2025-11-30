import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from '../entities/role.entity';
import { Permission } from '../../../shared/models/permission.enum';
import { ICreateRoleModel } from '../models/create-role.model';
import { UsersService } from 'src/modules/users/services/users.service';
import { RolesMapper } from '../mappers/roles.mapper';

@Injectable()
export class RolesService {
  constructor(
    private readonly usersService: UsersService,
    private readonly rolesMapper: RolesMapper,
    @InjectRepository(RoleEntity)
    private rolesRepository: Repository<RoleEntity>,
  ) {}

  async getRolesDictionary() {
    const roles = await this.rolesRepository.find({
      select: ['id', 'name',]
    });
    return roles;
  }

  async getAll() {
    const roles = await this.rolesRepository.find();
    return roles;
  }

  async getById(id: string) {
    const role = await this.rolesRepository.findOneOrFail({
      where: { id, }
    });
    return role;
  }

  async create(roleData: ICreateRoleModel) {
    const newRole = this.rolesRepository.create({
      name: roleData.name,
      permissions: roleData.permissions,
      rolePriority: roleData.rolePriority,
    },);
    return await this.rolesRepository.save(newRole);
  }
  async edit(roleData: ICreateRoleModel, roleId: string) {
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

  async checkUserRoleManageAccess(permissions: Permission[], userId: string): Promise<boolean> {
    const userData = await this.usersService.getUserById(userId);
    const userAccess = this.rolesMapper.rolesToAccess(userData?.roles ?? []);
    if (
      !userAccess.permissions.includes(Permission.ADMIN) &&
      permissions.some((permission) => !userAccess.permissions.includes(permission))
    ) throw new ForbiddenException('Cannot performe action with not owned permission or without admin access');
    return true;
  };

  async createRoleSoft(roleData: ICreateRoleModel, userId: string) {
    await this.checkUserRoleManageAccess(roleData.permissions, userId);
    return this.create(roleData);
  }
  async editRoleSoft(roleData: ICreateRoleModel, roleId: string, userId: string) {
    const rolePermissions = await this.rolesRepository.findOneOrFail({
      where: { id: roleId, },
      select: ['permissions'],
    });
    await this.checkUserRoleManageAccess(rolePermissions.permissions, userId);
    await this.checkUserRoleManageAccess(roleData.permissions, userId);
    return this.edit(roleData, roleId);
  }
}
