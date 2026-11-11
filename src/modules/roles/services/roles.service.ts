import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from '../entities/role.entity';
import { ICreateRoleModel } from '../models/create-role.model';
import { IEditRoleModel } from '../models/edit-role.model';
import { RolesMapper } from '../mappers/roles.mapper';
import { IRoleItemModel } from '../models/role-item.model';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { IRoleListItemModel } from '../models/role-list-item.model';
import { IGetRolesFiltersModel } from '../models/get-roles-filters.model';
import { AuthorityService } from './authority.service';

@Injectable()
export class RolesService {
  constructor(
    private readonly rolesMapper: RolesMapper,
    private readonly authorityService: AuthorityService,
    @InjectRepository(RoleEntity)
    private rolesRepository: Repository<RoleEntity>,
  ) {}

  async getRolesDictionary() {
    const roles = await this.rolesRepository.find({
      select: ['id', 'name',]
    });
    return roles.map(
      (r) => this.rolesMapper.entityToDictionaryItem(r)
    );
  }

  async getAll(params: IGetRolesFiltersModel, actorId: string): Promise<IGenericListPayloadResponse<IRoleListItemModel>> {
    const { page, pageSize, search, } = params;
    const rolesQb = this.rolesRepository
      .createQueryBuilder('roles')
      .orderBy('roles.rolePriority', 'DESC')
      .addOrderBy('roles.name', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (search) {
      rolesQb.andWhere('roles.name ILIKE :search', { search: `%${search}%`, });
    }

    const [[rolesData, total], actor] = await Promise.all([
      rolesQb.getManyAndCount(),
      this.authorityService.getAuthority(actorId),
    ]);

    return {
      items: rolesData.map(
        (r) => this.rolesMapper.entityToListItem(r, this.authorityService.canManageRole(actor, r))
      ),
      meta: { count: total, },
    };
  }

  async getById(id: string, actorId: string): Promise<IRoleItemModel> {
    const [role, actor] = await Promise.all([
      this.rolesRepository.findOneOrFail({ where: { id, }, }),
      this.authorityService.getAuthority(actorId),
    ]);
    return this.rolesMapper.entityToItem(role, this.authorityService.canManageRole(actor, role));
  }

  async createRole(roleData: ICreateRoleModel, actorId: string): Promise<IRoleItemModel> {
    const actor = await this.authorityService.getAuthority(actorId);
    const newRole = this.rolesRepository.create({
      name: roleData.name,
      permissions: roleData.permissions,
      rolePriority: roleData.rolePriority,
    },);
    this.authorityService.assertCanManageRoles(actor, [newRole]);

    const createdRole = await this.rolesRepository.save(newRole);
    return this.rolesMapper.entityToItem(createdRole, true);
  }

  async editRole(roleData: IEditRoleModel, roleId: string, actorId: string): Promise<boolean> {
    const [currentRole, actor] = await Promise.all([
      this.rolesRepository.findOneOrFail({ where: { id: roleId, }, }),
      this.authorityService.getAuthority(actorId),
    ]);
    const nextRole = {
      permissions: roleData.permissions,
      rolePriority: roleData.rolePriority ?? currentRole.rolePriority,
    };
    this.authorityService.assertCanManageRoles(actor, [currentRole, nextRole]);

    const updatedRole = await this.rolesRepository.update(
      { id: roleId, },
      {
        name: roleData.name,
        ...nextRole,
      },
    );
    return !!updatedRole.affected;
  }

  async deleteRole(roleId: string, actorId: string): Promise<IRoleItemModel> {
    const [role, actor] = await Promise.all([
      this.rolesRepository.findOneOrFail({ where: { id: roleId, }, }),
      this.authorityService.getAuthority(actorId),
    ]);
    this.authorityService.assertCanManageRoles(actor, [role]);

    const removedRole = await this.rolesRepository.remove(role);
    return this.rolesMapper.entityToItem({ ...removedRole, id: roleId, }, true);
  }
}
