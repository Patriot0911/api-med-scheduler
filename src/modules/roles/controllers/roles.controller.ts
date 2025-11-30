import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAccessGuard } from "src/modules/auth/guards/access-refresh.guard";
import { RolesService } from "../services/roles.service";
import { PermissionsGuard } from "src/modules/auth/guards/permission.guard";
import { Permissions } from "src/modules/auth/decorator/roles.decorator";
import { Permission } from "../../../shared/models/permission.enum";
import { CreateRoleRequestDto } from "../dto/create-role-request.dto";
import { IAccessTokenPayload } from "src/modules/auth/models/access-token-payload.model";

@ApiTags('Roles')
@Controller('api/roles')
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.VIEW_ROLES, Permission.ADMIN)
  async getAllRoles(): Promise<any> {
    return await this.rolesService.getAll();
  }

  @Get(':roleId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.VIEW_ROLES, Permission.ADMIN)
  async getRole(@Param('roleId') roleId: string): Promise<any> {
    return await this.rolesService.getById(roleId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.CREATE_ROLES, Permission.ADMIN)
  async createRole(@Body() data: CreateRoleRequestDto, @Req() request): Promise<any> {
    const { sub, } = <IAccessTokenPayload> request.user;
    return await this.rolesService.createRoleSoft(data, sub);
  }

  @Put(':roleId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.CREATE_ROLES, Permission.ADMIN)
  async editRole(
    @Param('roleId') roleId: string,
    @Body() data: CreateRoleRequestDto,
    @Req() request
  ): Promise<any> {
    const { sub, } = <IAccessTokenPayload> request.user;
    return await this.rolesService.editRoleSoft(data, roleId, sub);
  }
}
