import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RegistrationDto } from "../dto/registration.dto";
import { AuthService } from "../services/auth.service";
import { TRegisterResponse } from "../models/register.response";

@ApiTags('Auth')
@Controller('auth')
export class AuthController {

  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  login() {
    return { message: 'Login endpoint' };
  }

  @Post('register')
  async register(@Body() data: RegistrationDto): Promise<TRegisterResponse> {
    // return { message: 'Register endpoint' };
    return await this.authService.register(data);
  }

  @Post('refresh')
  refresh() {
    return { message: 'Refresh endpoint' };
  }
}
