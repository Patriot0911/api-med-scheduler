import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAccessGuard } from "src/modules/auth/guards/access-refresh.guard";
import { PermissionsGuard } from "src/modules/auth/guards/permission.guard";
import { Permissions } from "src/modules/auth/decorator/roles.decorator";
import { Permission } from "src/shared/models/permission.enum";
import type { IAccessTokenPayload } from "src/modules/auth/models/access-token-payload.model";
import { CurrentUser } from "src/modules/auth/decorator/current-user.decorator";
import { IGenericListPayloadResponse } from "src/shared/models/generic-list-payload.response";
import { UsersService } from '../services/users.service';
import { PasswordResetService } from '../services/password-reset.service';
import { GetUsersRequestDto } from '../dto/get-users-request.dto';
import { CreateUserRequestDto } from '../dto/create-user-request.dto';
import { EditUserRequestDto } from '../dto/edit-user-request.dto';
import { CreateStudentProfileRequestDto } from '../dto/create-student-profile-request.dto';
import { EditStudentProfileRequestDto } from '../dto/edit-student-profile-request.dto';
import { CreateTeacherProfileRequestDto } from '../dto/create-teacher-profile-request.dto';
import { EditTeacherProfileRequestDto } from '../dto/edit-teacher-profile-request.dto';
import { IUserListItemModel } from '../models/user-list-item.model';
import { IUserItemModel } from '../models/user-item.model';
import { ITeacherProfileModel } from '../models/teacher-profile.model';
import { IStudentProfileModel } from '../models/student-profile.model';
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
  @Permissions(Permission.READ_USERS)
  async getAllUsers(
    @Query() params: GetUsersRequestDto,
    @CurrentUser() { sub, }: IAccessTokenPayload,
  ): Promise<IGenericListPayloadResponse<IUserListItemModel>> {
    return await this.usersService.getAll(params, sub);
  }

  @Get(':userId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.READ_USERS)
  async getUser(
    @Param('userId') userId: string,
    @CurrentUser() { sub, }: IAccessTokenPayload,
  ): Promise<IUserItemModel> {
    return await this.usersService.getById(userId, sub);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_USERS)
  async createUser(
    @Body() data: CreateUserRequestDto,
    @CurrentUser() { sub, }: IAccessTokenPayload,
  ): Promise<IUserItemModel> {
    return await this.usersService.createUser(data, sub);
  }

  @Put(':userId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_USERS)
  async editUser(
    @Param('userId') userId: string,
    @Body() data: EditUserRequestDto,
    @CurrentUser() { sub, }: IAccessTokenPayload,
  ): Promise<IUserItemModel> {
    return await this.usersService.editUser(userId, data, sub);
  }

  @Post(':userId/password-reset-token')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_USERS)
  async createPasswordResetToken(
    @Param('userId') userId: string,
    @CurrentUser() { sub, }: IAccessTokenPayload,
  ): Promise<IPasswordResetTokenModel> {
    return await this.passwordResetService.createResetToken(userId, sub);
  }

  @Post(':userId/teacher')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_USERS)
  async createTeacherProfile(
    @Param('userId') userId: string,
    @Body() data: CreateTeacherProfileRequestDto,
    @CurrentUser() { sub, }: IAccessTokenPayload,
  ): Promise<ITeacherProfileModel> {
    return await this.usersService.createTeacherProfile(userId, data, sub);
  }

  /** Creates the teacher profile when the user has none, otherwise updates it */
  @Put(':userId/teacher')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_USERS)
  async editTeacherProfile(
    @Param('userId') userId: string,
    @Body() data: EditTeacherProfileRequestDto,
    @CurrentUser() { sub, }: IAccessTokenPayload,
  ): Promise<ITeacherProfileModel> {
    return await this.usersService.editTeacherProfile(userId, data, sub);
  }

  @Delete(':userId/teacher')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_USERS)
  async deleteTeacherProfile(
    @Param('userId') userId: string,
    @CurrentUser() { sub, }: IAccessTokenPayload,
  ): Promise<ITeacherProfileModel> {
    return await this.usersService.deleteTeacherProfile(userId, sub);
  }

  @Post(':userId/student')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_USERS)
  async createStudentProfile(
    @Param('userId') userId: string,
    @Body() data: CreateStudentProfileRequestDto,
    @CurrentUser() { sub, }: IAccessTokenPayload,
  ): Promise<IStudentProfileModel> {
    return await this.usersService.createStudentProfile(userId, data, sub);
  }

  /** Creates the student profile when the user has none, otherwise updates it */
  @Put(':userId/student')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_USERS)
  async editStudentProfile(
    @Param('userId') userId: string,
    @Body() data: EditStudentProfileRequestDto,
    @CurrentUser() { sub, }: IAccessTokenPayload,
  ): Promise<IStudentProfileModel> {
    return await this.usersService.editStudentProfile(userId, data, sub);
  }

  @Delete(':userId/student')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_USERS)
  async deleteStudentProfile(
    @Param('userId') userId: string,
    @CurrentUser() { sub, }: IAccessTokenPayload,
  ): Promise<IStudentProfileModel> {
    return await this.usersService.deleteStudentProfile(userId, sub);
  }
}
