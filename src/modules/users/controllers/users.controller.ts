import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAccessGuard } from "src/modules/auth/guards/access-refresh.guard";
import { PermissionsGuard } from "src/modules/auth/guards/permission.guard";
import { Permissions } from "src/modules/auth/decorator/roles.decorator";
import { Permission } from "src/shared/models/permission.enum";
import { IAccessTokenPayload } from "src/modules/auth/models/access-token-payload.model";
import { IGenericListPayloadResponse } from "src/shared/models/generic-list-payload.response";
import { UsersService } from '../services/users.service';
import { PasswordResetService } from '../services/password-reset.service';
import { GetUsersRequestDto } from '../dto/get-users-request.dto';
import { CreateUserRequestDto } from '../dto/create-user-request.dto';
import { IUserListItemModel } from '../models/user-list-item.model';
import { IUserItemModel } from '../models/user-item.model';
import { IPasswordResetTokenModel } from '../models/password-reset-token.model';

@ApiTags('Users')
@Controller('api/users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.READ_USERS, Permission.ADMIN)
  async getAllUsers(@Query() params: GetUsersRequestDto): Promise<IGenericListPayloadResponse<IUserListItemModel>> {
    return await this.usersService.getAll(params);
  }

  @Get(':userId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.READ_USERS, Permission.ADMIN)
  async getUser(@Param('userId') userId: string): Promise<IUserItemModel> {
    return await this.usersService.getById(userId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_USERS, Permission.ADMIN)
  async createUser(@Body() data: CreateUserRequestDto, @Req() request): Promise<IUserItemModel> {
    const { sub, } = <IAccessTokenPayload> request.user;
    return await this.usersService.createUser(data, sub);
  }

  @Post(':userId/password-reset-token')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_USERS, Permission.ADMIN)
  async createPasswordResetToken(@Param('userId') userId: string): Promise<IPasswordResetTokenModel> {
    return await this.passwordResetService.createResetToken(userId);
  }
}
