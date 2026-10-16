import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAccessGuard } from "src/modules/auth/guards/access-refresh.guard";
import { LessonsGroupsService } from "../services/lessons-groups.service";
import { PermissionsGuard } from 'src/modules/auth/guards/permission.guard';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { GetLessonGroupsRequestDto } from '../dto/lesson-groups/get-lesson-groups-request.dto';
import { Permissions } from 'src/modules/auth/decorator/roles.decorator';
import { ILessonGroupListItemModel } from '../models/lesson-groups/lesson-group-list-item.model';
import { ILessonGroupItemModel } from '../models/lesson-groups/lesson-group-item.model';
import { CreateLessonGroupRequestDto } from '../dto/lesson-groups/create-lesson-group-request.dto';
import { EditLessonGroupRequestDto } from '../dto/lesson-groups/edit-lesson-group-request.dto';
import { GenerateLessonSeriesRequestDto } from '../dto/lesson-groups/generate-lesson-series-request.dto';
import { CreateLessonGroupWithLessonsRequestDto } from '../dto/lesson-groups/create-lesson-group-with-lessons-request.dto';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';
import { ILessonGroupWithLessonsModel } from '../models/lesson-groups/lesson-group-with-lessons.model';
import { LESSON_MANAGE_PERMISSIONS } from '../services/lesson-access.service';
import type { ILessonManageScopeModel } from '../models/lesson-manage-scope.model';
import { LessonScope } from '../decorators/lesson-scope.decorator';

@ApiTags('Lessons Groups')
@Controller('api/lessons-groups')
export class LessonsGroupsController {
  constructor(
    private readonly lessonsGroups: LessonsGroupsService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(...LESSON_MANAGE_PERMISSIONS)
  async getAllLessonGroups(@Query() params: GetLessonGroupsRequestDto, @LessonScope() scope: ILessonManageScopeModel): Promise<IGenericListPayloadResponse<ILessonGroupListItemModel>> {
    return await this.lessonsGroups.getAll(params, scope);
  }

  @Get(':lessonGroupId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(...LESSON_MANAGE_PERMISSIONS)
  async getLessonGroup(@Param('lessonGroupId') lessonGroupId: string, @LessonScope() scope: ILessonManageScopeModel): Promise<ILessonGroupItemModel> {
    return await this.lessonsGroups.getById(lessonGroupId, scope);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(...LESSON_MANAGE_PERMISSIONS)
  async createLessonGroup(@Body() dto: CreateLessonGroupRequestDto, @LessonScope() scope: ILessonManageScopeModel): Promise<ILessonGroupItemModel> {
    return await this.lessonsGroups.createLessonGroup(dto, scope);
  }

  @Put(':lessonGroupId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(...LESSON_MANAGE_PERMISSIONS)
  async editLessonGroup(
    @Param('lessonGroupId') lessonGroupId: string,
    @Body() dto: EditLessonGroupRequestDto,
    @LessonScope() scope: ILessonManageScopeModel,
  ): Promise<boolean> {
    return await this.lessonsGroups.editLessonGroup(dto, lessonGroupId, scope);
  }

  @Delete(':lessonGroupId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(...LESSON_MANAGE_PERMISSIONS)
  async deleteLessonGroup(@Param('lessonGroupId') lessonGroupId: string, @LessonScope() scope: ILessonManageScopeModel): Promise<ILessonGroupItemModel> {
    return await this.lessonsGroups.deleteLessonGroup(lessonGroupId, scope);
  }

  @Post('with-lessons')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(...LESSON_MANAGE_PERMISSIONS)
  async createLessonGroupWithLessons(@Body() dto: CreateLessonGroupWithLessonsRequestDto, @LessonScope() scope: ILessonManageScopeModel): Promise<ILessonGroupWithLessonsModel> {
    return await this.lessonsGroups.createLessonGroupWithLessons(dto, scope);
  }

  @Post('generate-series')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(...LESSON_MANAGE_PERMISSIONS)
  async generateLessonSeries(@Body() dto: GenerateLessonSeriesRequestDto, @LessonScope() scope: ILessonManageScopeModel): Promise<ILessonItemModel[]> {
    return await this.lessonsGroups.generateLessonSeries(dto, scope);
  }

  @Put(':lessonGroupId/lessons/:lessonId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(...LESSON_MANAGE_PERMISSIONS)
  async assignLessonToGroup(
    @Param('lessonGroupId') lessonGroupId: string,
    @Param('lessonId') lessonId: string,
    @LessonScope() scope: ILessonManageScopeModel,
  ): Promise<boolean> {
    return await this.lessonsGroups.assignLessonToGroup(lessonGroupId, lessonId, scope);
  }
}
