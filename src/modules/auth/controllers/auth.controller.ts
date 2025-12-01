import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RegistrationDto } from "../dto/registration.dto";
import { LoginDto } from "../dto/login.dto";
import { ITokenModel } from "../models/token.model";
import { JwtRefreshGuard } from "../guards/jwt-refresh.guard";
import { JwtAccessGuard } from "../guards/access-refresh.guard";
import { AuthService } from "../services/auth.service";
import { IAccessTokenPayload } from "../models/access-token-payload.model";
import { IRefreshTokenPayloadWithToken } from "../models/refresh-token-payload.model";

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {

  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  async login(@Body() data: LoginDto): Promise<any> {
    return await this.authService.login(data);
  }

  @Post('register')
  async register(@Body() data: RegistrationDto): Promise<any> {
    return await this.authService.register(data);
  }

  @Post('refresh')
  @ApiBearerAuth()
  @UseGuards(JwtRefreshGuard)
  async refresh(@Req() request): Promise<ITokenModel> {
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
  async me(@Req() request): Promise<any> {
    const { sub, } = <IAccessTokenPayload> request.user;
    return await this.authService.getMe(sub);
  }
}
