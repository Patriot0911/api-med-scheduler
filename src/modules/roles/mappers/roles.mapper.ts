import { Injectable } from '@nestjs/common';
import { RoleEntity } from 'src/modules/roles/entities/role.entity';

@Injectable()
export class RolesMapper {
  rolesToAccess(roles: RoleEntity[]) {
    const roleNames = roles.map(r => r.name);
    const aggregatedPermissions = [
      ...new Set(roles.flatMap(role => role.permissions),),
    ];
    return {
      roles: roleNames,
      permissions: aggregatedPermissions,
    };
  }
}
