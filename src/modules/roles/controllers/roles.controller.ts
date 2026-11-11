import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAccessGuard } from "src/modules/auth/guards/access-refresh.guard";
import { RolesService } from "../services/roles.service";
import { PermissionsGuard } from "src/modules/auth/guards/permission.guard";
import { Permissions } from "src/modules/auth/decorator/roles.decorator";
import { Permission } from "../../../shared/models/permission.enum";
import { CreateRoleRequestDto } from "../dto/create-role-request.dto";
import type { IAccessTokenPayload } from "src/modules/auth/models/access-token-payload.model";
import { CurrentUser } from "src/modules/auth/decorator/current-user.decorator";
import { IGenericListPayloadResponse } from "src/shared/models/generic-list-payload.response";
import { IRoleListItemModel } from "../models/role-list-item.model";
import { IRoleItemModel } from "../models/role-item.model";
import { GetRolesRequestDto } from "../dto/get-roles-request.dto";
import { EditRoleRequestDto } from "../dto/edit-role-request.dto";

@ApiTags('Roles')
@Controller('api/roles')
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_ROLES)
  async getAllRoles(
    @Query() params: GetRolesRequestDto,
    @CurrentUser() { sub, }: IAccessTokenPayload,
  ): Promise<IGenericListPayloadResponse<IRoleListItemModel>> {
    return await this.rolesService.getAll(params, sub);
  }

  @Get(':roleId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_ROLES)
  async getRole(
    @Param('roleId') roleId: string,
    @CurrentUser() { sub, }: IAccessTokenPayload,
  ): Promise<IRoleItemModel> {
    return await this.rolesService.getById(roleId, sub);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_ROLES)
  async createRole(
    @Body() data: CreateRoleRequestDto,
    @CurrentUser() { sub, }: IAccessTokenPayload,
  ): Promise<IRoleItemModel> {
    return await this.rolesService.createRole(data, sub);
  }

  @Put(':roleId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_ROLES)
  async editRole(
    @Param('roleId') roleId: string,
    @Body() data: EditRoleRequestDto,
    @CurrentUser() { sub, }: IAccessTokenPayload,
  ): Promise<boolean> {
    return await this.rolesService.editRole(data, roleId, sub);
  }

  @Delete(':roleId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_ROLES)
  async deleteRole(
    @Param('roleId') roleId: string,
    @CurrentUser() { sub, }: IAccessTokenPayload,
  ): Promise<IRoleItemModel> {
    return await this.rolesService.deleteRole(roleId, sub);
  }
}
