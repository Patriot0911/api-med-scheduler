import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
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
import { PermissionsGuard } from "../guards/permission.guard";
import { Permissions } from "../decorator/roles.decorator";
import { Permission } from "src/modules/roles/models/permission.enum";

@ApiTags('Auth')
@Controller('api/auth')
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
    const { user } = request;
    return await this.authService.refresh(user);
  }

  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async logout(@Req() request): Promise<TLogoutResponse> {
    const { user } = request;
    return await this.authService.logout(user);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.CHANGE_SCHEDULE)
  async me(@Req() request): Promise<TLogoutResponse> {
    const { user } = request;
    return await this.authService.logout(user);
  }
}
