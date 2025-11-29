import { BadRequestException, Injectable } from '@nestjs/common';
import { RegistrationDto } from '../dto/registration.dto';
import { TRegisterResponse } from '../models/register.response';
import { PasswordService } from './password.service';
import { UserService } from 'src/modules/users/services/user.service';
import { SessionService } from './session.service';
import { LoginDto } from '../dto/login.dto';
import { TLoginResponse } from '../models/login.response';
import { ITokenModel } from '../models/token.model';
import { IRefreshTokenPayload } from '../models/refresh-token-payload.model';
import { TLogoutResponse } from '../models/logout.response';
import { IAccessTokenPayload } from '../models/access-token-payload.model';

@Injectable()
export class AuthService {
  constructor(
    private readonly passwordService: PasswordService,
    private readonly sessionService: SessionService,
    private readonly userService: UserService,
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

    return {
      data: {
        token: sessionData,
        user: {
          id: createdUser.id,
          email: createdUser.email,
          fullName: createdUser.fullName,
        },
      },
      status: true,
    };
  }

  async login(data: LoginDto): Promise<TLoginResponse> {
    const { email, password, } = data;

    const existingUser = await this.userService.getUserByEmail(email);
    if (!existingUser) {
      throw new BadRequestException('Invalid credentials');
    }

    const sessionData = await this.sessionService.initSession(existingUser);

    return {
      data: {
        token: sessionData,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          fullName: existingUser.fullName,
        },
      },
      status: true,
    };
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
