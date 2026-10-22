import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { Repository } from 'typeorm';
import { ILoginModel } from '../models/login.model';
import { PasswordService } from './password.service';
import { IRegisterModel } from '../models/register.model';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenType } from '../models/token-type.enum';
import { Permission } from 'src/shared/models/permission.enum';
import { RoleEntity } from 'src/modules/roles/entities/role.entity';
import { RolesMapper } from 'src/modules/roles/mappers/roles.mapper';
import { IRefreshTokenPayload } from '../models/refresh-token-payload.model';
import { IAccessTokenPayload } from '../models/access-token-payload.model';
import { IUserPayload } from '../models/user-payload.model';
import { AuthMapper } from '../mappers/auth.mapper';
import { IAuthResponse } from '../models/auth-response.model';
import { IEditMeModel } from '../models/edit-me.model';
import { IChangePasswordModel } from '../models/change-password.model';

@Injectable()
export class AuthService {
  constructor(
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly rolesMapper: RolesMapper,
    private readonly authMapper: AuthMapper,
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private rolesRepository: Repository<RoleEntity>,
  ) {}

  async getMe(userId: string): Promise<IUserPayload> {
    const userData = await this.usersRepository.findOneOrFail({
      where: { id: userId, },
      relations: ['roles', 'teacher', 'student'],
    });
    return this.authMapper.userEntityToUserPayload(userData);
  }

  async editMe(userId: string, data: IEditMeModel): Promise<IUserPayload> {
    const userData = await this.usersRepository.findOneOrFail({
      where: { id: userId, },
    });

    if (data.email !== userData.email) {
      // the email is the login, so changing it is confirmed like a password change
      const isValidPassword = !!data.currentPassword
        && await this.passwordService.verify(userData.password, data.currentPassword);
      if (!isValidPassword) throw new BadRequestException('Current password is incorrect');

      const existingUser = await this.usersRepository.findOne({
        where: { email: data.email, },
      });
      if (existingUser) throw new BadRequestException('Email is already in use');
    }

    await this.usersRepository.update(
      { id: userId, },
      { email: data.email, fullName: data.fullName, },
    );
    return this.getMe(userId);
  }

  async changePassword(userId: string, data: IChangePasswordModel): Promise<boolean> {
    const userData = await this.usersRepository.findOneOrFail({
      where: { id: userId, },
    });

    // an open session alone is not enough to take over the account
    const isValidPassword = await this.passwordService.verify(userData.password, data.currentPassword);
    if (!isValidPassword) throw new BadRequestException('Current password is incorrect');

    const hashedPassword = await this.passwordService.hash(data.newPassword);
    await this.usersRepository.update({ id: userId, }, { password: hashedPassword, });
    return true;
  }

  async login(data: ILoginModel): Promise<IAuthResponse> {
    const userData = await this.usersRepository.findOne({
      where: { email: data.email, },
      relations: ['teacher', 'student'],
    });
    if (!userData) throw new BadRequestException('Invalid credentials');
    const isValidPassword = await this.passwordService.verify(userData.password, data.password);
    if (!isValidPassword) throw new BadRequestException('Invalid credentials');
    const userRoles = await this.rolesRepository.find({
      where: {
        users: [
          { id: userData.id, },
        ],
      },
    });
    const { permissions, roles, } = this.rolesMapper.rolesToAccess(userRoles);
    const tokens = await this.generateTokens(
      userData.id,
      permissions,
      roles
    );
    await this.updateRefreshToken(userData.id, tokens.refreshToken);
    await this.markUserLoggedIn(userData.id);
    return this.authMapper.entitiesToAuth(tokens, { ...userData, roles: userRoles, });
  }

  async register(data: IRegisterModel): Promise<IAuthResponse> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: data.email, },
    });
    if (existingUser) {
      throw new BadRequestException('Email is already in use');
    }
    const hashedPassword = await this.passwordService.hash(data.password);
    const newUser = this.usersRepository.create({
      email: data.email,
      fullName: data.fullName,
      password: hashedPassword,
    });
    const createdUser = await this.usersRepository.save(newUser);
    const { permissions, roles, } = this.rolesMapper.rolesToAccess(newUser.roles ?? []);
    const tokens = await this.generateTokens(
      createdUser.id,
      permissions,
      roles
    );
    await this.updateRefreshToken(createdUser.id, tokens.refreshToken);
    await this.markUserLoggedIn(createdUser.id);
    return this.authMapper.entitiesToAuth(tokens, createdUser);
  }

  async refreshToken(userId: string, refreshToken: string) {
    const userData = await this.usersRepository.findOne({
      where: { id: userId, },
      relations: ['teacher', 'student'],
    });
    if (!userData || !userData.refreshToken) throw new UnauthorizedException();

    const isValid = await this.passwordService.verify(userData.refreshToken, refreshToken);
    if (!isValid) throw new UnauthorizedException();
    const userRoles = await this.rolesRepository.find({
      where: {
        users: [
          { id: userData.id, },
        ],
      },
    });
    const { permissions, roles, } = this.rolesMapper.rolesToAccess(userRoles);
    const tokens = await this.generateTokens(
      userId,
      permissions,
      roles,
    );
    await this.updateRefreshToken(userId, tokens.refreshToken);
    return this.authMapper.entitiesToAuth(tokens, { ...userData, roles: userRoles, });
  }

  async logout(userId: string): Promise<boolean> {
    const updatedUser = await this.usersRepository.update(
      { id: userId, },
      { refreshToken: null, }
    );
    return !!updatedUser.affected;
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashed = await this.passwordService.hash(refreshToken);
    await this.usersRepository.update({ id: userId, }, { refreshToken: hashed, });
  }

  async markUserLoggedIn(userId: string): Promise<void> {
    await this.usersRepository.update({ id: userId, }, { lastLoginAt: new Date(), });
  }

  async generateTokens(userId: string, permissions: Permission[], roles: string[]) {
    const accessPayload: IAccessTokenPayload = {
      use: TokenType.Access,
      sub: userId,
      permissions,
      roles,
    };
    const refreshPayload: IRefreshTokenPayload = {
      use: TokenType.Refresh,
      sub: userId,
    };
    const accessToken = await this.signTokenPayload(accessPayload, TokenType.Access);
    const refreshToken = await this.signTokenPayload(refreshPayload, TokenType.Refresh);
    return { accessToken, refreshToken };
  }

  async verifyRefreshToken(userId: string, refreshToken: string) {
    const userData = await this.usersRepository.findOne({
      where: { id: userId, },
    });
    if (!userData || !userData?.refreshToken) return false;
    const isValidRefresh = await this.passwordService.verify(userData.refreshToken, refreshToken);
    return isValidRefresh;
  };

  async signTokenPayload(payload: any, type: TokenType): Promise<string> {
    return await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get(`auth.jwt.ttl.${type}`),
      secret: this.configService.get(`auth.jwt.secret.${type}`),
    });
  }
}
