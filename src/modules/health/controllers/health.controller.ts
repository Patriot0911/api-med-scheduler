import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthService } from '../services/health.service';

@ApiTags('Health')
@Controller('api/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  live(): { status: string } {
    return { status: 'ok', };
  }

  @Get('ready')
  async ready(): Promise<{ status: string }> {
    await this.healthService.checkDatabase();
    return { status: 'ok', };
  }
}
