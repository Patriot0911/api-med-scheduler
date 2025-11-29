import { BadRequestException, Injectable } from '@nestjs/common';
import { RegistrationDto } from '../dto/registration.dto';
import { TRegisterResponse } from '../models/register.response';
import { PasswordService } from './password.service';
import { UserService } from 'src/modules/users/services/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly passwordService: PasswordService,
    private readonly userService: UserService,
  ) {}

  async register(data: RegistrationDto): Promise<TRegisterResponse> {
    const { email, password, fullName, } = data;

    const userWithEmail = await this.userService.getUserByEmail(email);
    if (userWithEmail) {
      throw new BadRequestException('User already exists');
    }

    const encryptedPassword = await this.passwordService.hash(password);

    const createdUser = await this.userService.createUser(
      email,
      encryptedPassword,
      fullName,
    );

    return {
      data: {
        token: {
          accessToken: 'dummy_access_token',
          refreshToken: 'dummy_refresh_token',
        },
        user: {
          id: createdUser.id,
          email: createdUser.email,
          fullName: createdUser.fullName,
        },
      },
      status: true,
    };
  }
}
