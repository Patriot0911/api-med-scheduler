import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAccessGuard } from "src/modules/auth/guards/access-refresh.guard";
import { StudentgroupsService } from "../services/student-groups.service";

@ApiTags('Student Groups')
@Controller('api/lessons')
export class StudentGroupsController {
  constructor(
    private readonly studentGroups: StudentgroupsService,
  ) {}

  // @Get()
  // @ApiBearerAuth()
  // @UseGuards(JwtAccessGuard)
  // async getLessons(): Promise<any> {
  //   return await this.studentGroups.getAllLessons();
  // }
}
