import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
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

  @Put(':userId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_USERS, Permission.ADMIN)
  async editUser(
    @Param('userId') userId: string,
    @Body() data: EditUserRequestDto,
    @Req() request,
  ): Promise<IUserItemModel> {
    const { sub, } = <IAccessTokenPayload> request.user;
    return await this.usersService.editUser(userId, data, sub);
  }

  @Post(':userId/password-reset-token')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_USERS, Permission.ADMIN)
  async createPasswordResetToken(@Param('userId') userId: string): Promise<IPasswordResetTokenModel> {
    return await this.passwordResetService.createResetToken(userId);
  }

  @Post(':userId/teacher')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_USERS, Permission.ADMIN)
  async createTeacherProfile(
    @Param('userId') userId: string,
    @Body() data: CreateTeacherProfileRequestDto,
  ): Promise<ITeacherProfileModel> {
    return await this.usersService.createTeacherProfile(userId, data);
  }

  /** Creates the teacher profile when the user has none, otherwise updates it */
  @Put(':userId/teacher')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_USERS, Permission.ADMIN)
  async editTeacherProfile(
    @Param('userId') userId: string,
    @Body() data: EditTeacherProfileRequestDto,
  ): Promise<ITeacherProfileModel> {
    return await this.usersService.editTeacherProfile(userId, data);
  }

  @Delete(':userId/teacher')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_USERS, Permission.ADMIN)
  async deleteTeacherProfile(@Param('userId') userId: string): Promise<ITeacherProfileModel> {
    return await this.usersService.deleteTeacherProfile(userId);
  }

  @Post(':userId/student')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_USERS, Permission.ADMIN)
  async createStudentProfile(
    @Param('userId') userId: string,
    @Body() data: CreateStudentProfileRequestDto,
  ): Promise<IStudentProfileModel> {
    return await this.usersService.createStudentProfile(userId, data);
  }

  /** Creates the student profile when the user has none, otherwise updates it */
  @Put(':userId/student')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_USERS, Permission.ADMIN)
  async editStudentProfile(
    @Param('userId') userId: string,
    @Body() data: EditStudentProfileRequestDto,
  ): Promise<IStudentProfileModel> {
    return await this.usersService.editStudentProfile(userId, data);
  }

  @Delete(':userId/student')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_USERS, Permission.ADMIN)
  async deleteStudentProfile(@Param('userId') userId: string): Promise<IStudentProfileModel> {
    return await this.usersService.deleteStudentProfile(userId);
  }
}
