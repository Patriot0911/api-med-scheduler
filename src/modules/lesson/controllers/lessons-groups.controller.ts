import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAccessGuard } from "src/modules/auth/guards/access-refresh.guard";
import { LessonsGroupsService } from "../services/lessons-groups.service";

@ApiTags('Lessons Groups')
@Controller('api/lessons-groups')
export class LessonsGroupsController {
  constructor(
    private readonly lessonsGroups: LessonsGroupsService,
  ) {}

  // @Get()
  // @ApiBearerAuth()
  // @UseGuards(JwtAccessGuard)
  // async getLessons(): Promise<any> {
  //   return await this.lessonsGroups.getAllGroups();
  // }
}
