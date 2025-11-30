import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAccessGuard } from "src/modules/auth/guards/access-refresh.guard";
import { PermissionsGuard } from "src/modules/auth/guards/permission.guard";
import { Permissions } from "src/modules/auth/decorator/roles.decorator";
import { RolesService } from "src/modules/roles/services/roles.service";
import { Permission } from "src/shared/models/permission.enum";
import { DictionariesService } from "../services/dictionaries.service";

@ApiTags('Dictionaries')
@Controller('api/dictionaries')
export class DictionariesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly dictionariesService: DictionariesService,
  ) {}

  @Get('roles')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.VIEW_ROLES, Permission.ADMIN)
  async getRolesDictionary(): Promise<any> {
    return await this.rolesService.getRolesDictionary();
  }
  @Get('permissions')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.VIEW_ROLES, Permission.ADMIN)
  getPermissionsDictionary(): any {
    return this.dictionariesService.getPermissions();
  }
}
