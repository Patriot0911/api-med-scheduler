import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAccessGuard } from "src/modules/auth/guards/access-refresh.guard";
import { LessonsService } from "../services/lessons.service";

@ApiTags('Lessons')
@Controller('api/lessons')
export class LessonsController {
  constructor(
    private readonly lessonsService: LessonsService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async getLessons(): Promise<any> {
    return await this.lessonsService.getAllLessons();
  }
}
