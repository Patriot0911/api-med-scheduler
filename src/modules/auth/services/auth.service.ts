import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { RegistrationDto } from '../dto/registration.dto';
import { TRegisterResponse } from '../models/register.response';
import { PasswordService } from './password.service';
import { UsersService } from 'src/modules/users/services/users.service';
import { SessionService } from './session.service';
import { LoginDto } from '../dto/login.dto';
import { TLoginResponse } from '../models/login.response';
import { ITokenModel } from '../models/token.model';
import { IRefreshTokenPayload } from '../models/refresh-token-payload.model';
import { TLogoutResponse } from '../models/logout.response';
import { IAccessTokenPayload } from '../models/access-token-payload.model';
import { TGetMeResponse } from '../models/get-me.response';

@Injectable()
export class AuthService {
  constructor(
    private readonly passwordService: PasswordService,
    private readonly sessionService: SessionService,
    private readonly userService: UsersService,
  ) {}

  async register(data: RegistrationDto): Promise<TRegisterResponse> {
    const { email, password, fullName, } = data;

    const userWithEmail = await this.userService.getUserByEmail(email);
    if (userWithEmail) {
      throw new BadRequestException('User already exists');
    }

    const encryptedPassword = await this.passwordService.hash(password);

    const { id, } = await this.userService.createUser(
      email,
      encryptedPassword,
      fullName,
    );

    const createdUser = await this.userService.getUserById(id);
    if (!createdUser) {
      throw new BadRequestException('Error creating user');
    }

    const sessionData = await this.sessionService.initSession(createdUser);

    const roleNames = createdUser.roles.map(r => r.name);
    const aggregatedPermissions = [
      ...new Set(
        createdUser.roles.flatMap(role => role.permissions),
      ),
    ];

    return {
      data: {
        token: sessionData,
        user: {
          id: createdUser.id,
          email: createdUser.email,
          fullName: createdUser.fullName,
          roles: roleNames,
          permissions: aggregatedPermissions,
        },
      },
      status: true,
    };
  }

  async login(data: LoginDto): Promise<TLoginResponse> {
    const { email, password, } = data;

    const existingUser = await this.userService.getUserByEmail(email);
    if (!existingUser || !(await this.passwordService.verify(existingUser.password, password))) {
      throw new BadRequestException('Invalid credentials');
    }

    const sessionData = await this.sessionService.initSession(existingUser);

    const roleNames = existingUser.roles.map(r => r.name);
    const aggregatedPermissions = [
      ...new Set(
        existingUser.roles.flatMap(role => role.permissions),
      ),
    ];

    return {
      data: {
        token: sessionData,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          fullName: existingUser.fullName,
          permissions: aggregatedPermissions,
          roles: roleNames,
        },
      },
      status: true,
    };
  }

  async getMe(userId: string): Promise<TGetMeResponse> {
    const userData = await this.userService.getUserById(userId);

    if (!userData)
      throw new UnauthorizedException('User not found');

    const roleNames = userData.roles.map(r => r.name);
    const aggregatedPermissions = [
      ...new Set(
        userData.roles.flatMap(role => role.permissions),
      ),
    ];

    return {
      data: {
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        permissions: aggregatedPermissions,
        roles: roleNames,
      },
      status: true,
    }
  }

  async refresh(refreshData: IRefreshTokenPayload): Promise<ITokenModel> {
    return await this.sessionService.refresh(refreshData);
  }

  async logout(accessToken: IAccessTokenPayload): Promise<TLogoutResponse> {
    await this.sessionService.logout(accessToken);
    return {
      data: true,
      status: true,
    };
  }
}
