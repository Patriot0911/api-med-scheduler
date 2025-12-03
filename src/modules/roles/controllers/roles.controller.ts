import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAccessGuard } from "src/modules/auth/guards/access-refresh.guard";
import { RolesService } from "../services/roles.service";
import { PermissionsGuard } from "src/modules/auth/guards/permission.guard";
import { Permissions } from "src/modules/auth/decorator/roles.decorator";
import { Permission } from "../../../shared/models/permission.enum";
import { CreateRoleRequestDto } from "../dto/create-role-request.dto";
import { IAccessTokenPayload } from "src/modules/auth/models/access-token-payload.model";
import { IGenericListPayloadResponse } from "src/shared/models/generic-list-payload.response";
import { IRoleListItemModel } from "../models/role-list-item.model";
import { IRoleItemModel } from "../models/role-item.model";
import { GetSemestersRequestDto } from "../dto/get-roles-request.dto";
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
  @Permissions(Permission.VIEW_ROLES, Permission.ADMIN)
  async getAllRoles(@Query() params: GetSemestersRequestDto): Promise<IGenericListPayloadResponse<IRoleListItemModel>> {
    console.log({params});
    return await this.rolesService.getAll(params);
  }

  @Get(':roleId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.VIEW_ROLES, Permission.ADMIN)
  async getRole(@Param('roleId') roleId: string): Promise<IRoleItemModel> {
    return await this.rolesService.getById(roleId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.CREATE_ROLES, Permission.ADMIN)
  async createRole(@Body() data: CreateRoleRequestDto, @Req() request): Promise<IRoleItemModel> {
    const { sub, } = <IAccessTokenPayload> request.user;
    return await this.rolesService.createRole(data, sub);
  }

  @Put(':roleId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.EDIT_ROLES, Permission.ADMIN)
  async editRole(
    @Param('roleId') roleId: string,
    @Body() data: EditRoleRequestDto,
    @Req() request
  ): Promise<boolean> {
    const { sub, } = <IAccessTokenPayload> request.user;
    return await this.rolesService.editRole(data, roleId, sub);
  }

  @Delete(':roleId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.DELETE_ROLES, Permission.ADMIN)
  async deleteRole(@Param('roleId') roleId: string, @Req() request): Promise<IRoleItemModel> {
    const { sub, } = <IAccessTokenPayload> request.user;
    return await this.rolesService.deleteRole(roleId, sub);
  }
}
