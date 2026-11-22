import { Body, Controller, Get, HttpStatus, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RegistrationDto } from '../dto/registration.dto';
import { LoginDto } from '../dto/login.dto';
import { JwtRefreshGuard } from '../guards/jwt-refresh.guard';
import { JwtAccessGuard } from '../guards/access-refresh.guard';
import { AuthService } from '../services/auth.service';
import type { IAccessTokenPayload } from '../models/access-token-payload.model';
import type { IRefreshTokenPayloadWithToken } from '../models/refresh-token-payload.model';
import { IUserPayload } from '../models/user-payload.model';
import { IAuthResponse } from '../models/auth-response.model';
import { ApiGenericResponses } from 'src/shared/factories/api-generic-responses.factory';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { UserPayloadDto } from '../dto/user-payload.dto';
import { Feature } from 'src/shared/decorator/features.decorator';
import { FeatureGuard } from 'src/shared/guards/features.guard';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { EditMeDto } from '../dto/edit-me.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { PasswordResetService } from 'src/modules/users/services/password-reset.service';
import { CurrentUser } from '../decorator/current-user.decorator';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @Post('login')
  @ApiGenericResponses({[HttpStatus.CREATED]: AuthResponseDto,})
  async login(@Body() data: LoginDto): Promise<IAuthResponse> {
    return await this.authService.login(data);
  }

  @Post('register')
  @Feature('register')
  @UseGuards(FeatureGuard)
  @ApiGenericResponses({[HttpStatus.CREATED]: AuthResponseDto,})
  async register(@Body() data: RegistrationDto): Promise<IAuthResponse> {
    return await this.authService.register(data);
  }

  @Post('refresh')
  @ApiBearerAuth()
  @UseGuards(JwtRefreshGuard)
  @ApiGenericResponses({[HttpStatus.CREATED]: AuthResponseDto,})
  async refresh(@CurrentUser() { sub, refreshToken, }: IRefreshTokenPayloadWithToken): Promise<IAuthResponse> {
    return await this.authService.refreshToken(sub, refreshToken);
  }

  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(JwtRefreshGuard)
  async logout(@CurrentUser() { sub, }: IRefreshTokenPayloadWithToken): Promise<boolean> {
    return await this.authService.logout(sub);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  @ApiGenericResponses({[HttpStatus.OK]: UserPayloadDto,})
  async me(@CurrentUser() { sub, }: IAccessTokenPayload): Promise<IUserPayload> {
    return await this.authService.getMe(sub);
  }

  @Put('me')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  @ApiGenericResponses({[HttpStatus.OK]: UserPayloadDto,})
  async editMe(@Body() data: EditMeDto, @CurrentUser() { sub, }: IAccessTokenPayload): Promise<IUserPayload> {
    return await this.authService.editMe(sub, data);
  }

  @Put('me/password')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async changePassword(@Body() data: ChangePasswordDto, @CurrentUser() { sub, }: IAccessTokenPayload): Promise<boolean> {
    return await this.authService.changePassword(sub, data);
  }

  @Post('reset-password')
  async resetPassword(@Body() data: ResetPasswordDto): Promise<boolean> {
    return await this.passwordResetService.resetPassword(data.token, data.newPassword);
  }
}
