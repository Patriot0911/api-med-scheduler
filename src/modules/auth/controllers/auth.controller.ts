import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RegistrationDto } from "../dto/registration.dto";
import { AuthService } from "../services/auth.service";
import { TRegisterResponse } from "../models/register.response";
import { LoginDto } from "../dto/login.dto";
import { TLoginResponse } from "../models/login.response";
import { ITokenModel } from "../models/token.model";
import { JwtRefreshGuard } from "../guards/jwt-refresh.guard";
import { TLogoutResponse } from "../models/logout.response";
import { JwtAccessGuard } from "../guards/access-refresh.guard";

@ApiTags('Auth')
@Controller('auth')
export class AuthController {

  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  async login(@Body() data: LoginDto): Promise<TLoginResponse> {
    return await this.authService.login(data);
  }

  @Post('register')
  async register(@Body() data: RegistrationDto): Promise<TRegisterResponse> {
    return await this.authService.register(data);
  }

  @Post('refresh')
  @ApiBearerAuth()
  @UseGuards(JwtRefreshGuard)
  async refresh(@Req() request): Promise<ITokenModel> {
    const { user } = request.body;
    return await this.authService.refresh(user);
  }

  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async logout(@Req() request): Promise<TLogoutResponse> {
    const { user } = request;

    return await this.authService.logout(user);
  }
}
