import { Body, Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAccessGuard } from "src/modules/auth/guards/access-refresh.guard";
import { LessonsGroupsService } from "../services/lessons-groups.service";
import { Permission } from 'src/shared/models/permission.enum';
import { PermissionsGuard } from 'src/modules/auth/guards/permission.guard';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { GetLessonGroupsRequestDto } from '../dto/lesson-groups/get-lesson-groups-request.dto';
import { ISemesterListItemModel } from 'src/modules/semester/models/semester-list-item.model';
import { Permissions } from 'src/modules/auth/decorator/roles.decorator';
import { ILessonGroupListItemModel } from '../models/lesson-groups/lesson-group-list-item.model';
import { CreateLessonGroupRequestDto } from '../dto/lesson-groups/create-lesson-group-request.dto';

@ApiTags('Lessons Groups')
@Controller('api/lessons-groups')
export class LessonsGroupsController {
  constructor(
    private readonly lessonsGroups: LessonsGroupsService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.ADMIN)
  async getAllLessongGroups(@Query() params: GetLessonGroupsRequestDto): Promise<IGenericListPayloadResponse<ILessonGroupListItemModel>> {
    return await this.lessonsGroups.getAll(params);
  }

  // @Get()
  // @ApiBearerAuth()
  // @UseGuards(JwtAccessGuard, PermissionsGuard)
  // @Permissions(Permission.ADMIN)
  // async createLessonGroup(@Body() dto: CreateLessonGroupRequestDto): Promise<any> {
  //   return await this.lessonsGroups.create();
  // }
}
