import { Body, Controller, Get, HttpStatus, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RegistrationDto } from "../dto/registration.dto";
import { LoginDto } from "../dto/login.dto";
import { JwtRefreshGuard } from "../guards/jwt-refresh.guard";
import { JwtAccessGuard } from "../guards/access-refresh.guard";
import { AuthService } from "../services/auth.service";
import { IAccessTokenPayload } from "../models/access-token-payload.model";
import { IRefreshTokenPayloadWithToken } from "../models/refresh-token-payload.model";
import { IUserPayload } from "../models/user-payload.model";
import { IAuthResponse } from "../models/auth-response.model";
import { ApiGenericResponses } from "src/shared/factories/api-generic-responses.factory";
import { AuthResponseDto } from "../dto/auth-response.dto";
import { UserPayloadDto } from "../dto/user-payload.dto";

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  @ApiGenericResponses({[HttpStatus.CREATED]: AuthResponseDto,})
  async login(@Body() data: LoginDto): Promise<IAuthResponse> {
    return await this.authService.login(data);
  }

  @Post('register')
  @ApiGenericResponses({[HttpStatus.CREATED]: AuthResponseDto,})
  async register(@Body() data: RegistrationDto): Promise<IAuthResponse> {
    return await this.authService.register(data);
  }

  @Post('refresh')
  @ApiBearerAuth()
  @UseGuards(JwtRefreshGuard)
  @ApiGenericResponses({[HttpStatus.CREATED]: AuthResponseDto,})
  async refresh(@Req() request): Promise<IAuthResponse> {
    const { sub, refreshToken } = <IRefreshTokenPayloadWithToken> request.user;
    return await this.authService.refreshToken(sub, refreshToken);
  }

  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async logout(@Req() request): Promise<boolean> {
    const { sub } = <IAccessTokenPayload> request.user;
    return await this.authService.logout(sub);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  @ApiGenericResponses({[HttpStatus.OK]: UserPayloadDto,})
  async me(@Req() request): Promise<IUserPayload> {
    const { sub, } = <IAccessTokenPayload> request.user;
    return await this.authService.getMe(sub);
  }
}
