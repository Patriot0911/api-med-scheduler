import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAccessGuard } from "src/modules/auth/guards/access-refresh.guard";
import { LessonsGroupsService } from "../services/lessons-groups.service";
import { Permission } from 'src/shared/models/permission.enum';
import { PermissionsGuard } from 'src/modules/auth/guards/permission.guard';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { GetLessonGroupsRequestDto } from '../dto/lesson-groups/get-lesson-groups-request.dto';
import { Permissions } from 'src/modules/auth/decorator/roles.decorator';
import { ILessonGroupListItemModel } from '../models/lesson-groups/lesson-group-list-item.model';
import { ILessonGroupItemModel } from '../models/lesson-groups/lesson-group-item.model';
import { CreateLessonGroupRequestDto } from '../dto/lesson-groups/create-lesson-group-request.dto';
import { EditLessonGroupRequestDto } from '../dto/lesson-groups/edit-lesson-group-request.dto';

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
  async getAllLessonGroups(@Query() params: GetLessonGroupsRequestDto): Promise<IGenericListPayloadResponse<ILessonGroupListItemModel>> {
    return await this.lessonsGroups.getAll(params);
  }

  @Get(':lessonGroupId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.ADMIN)
  async getLessonGroup(@Param('lessonGroupId') lessonGroupId: string): Promise<ILessonGroupItemModel> {
    return await this.lessonsGroups.getById(lessonGroupId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.ADMIN)
  async createLessonGroup(@Body() dto: CreateLessonGroupRequestDto): Promise<ILessonGroupItemModel> {
    return await this.lessonsGroups.createLessonGroup(dto);
  }

  @Put(':lessonGroupId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.ADMIN)
  async editLessonGroup(
    @Param('lessonGroupId') lessonGroupId: string,
    @Body() dto: EditLessonGroupRequestDto,
  ): Promise<boolean> {
    return await this.lessonsGroups.editLessonGroup(dto, lessonGroupId);
  }

  @Delete(':lessonGroupId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.ADMIN)
  async deleteLessonGroup(@Param('lessonGroupId') lessonGroupId: string): Promise<ILessonGroupItemModel> {
    return await this.lessonsGroups.deleteLessonGroup(lessonGroupId);
  }
}
