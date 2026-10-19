import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAccessGuard } from "src/modules/auth/guards/access-refresh.guard";
import { PermissionsGuard } from 'src/modules/auth/guards/permission.guard';
import { Permissions } from 'src/modules/auth/decorator/roles.decorator';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { GetLessonGroupsRequestDto } from '../dto/lesson-groups/get-lesson-groups-request.dto';
import { ILessonGroupListItemModel } from '../models/lesson-groups/lesson-group-list-item.model';
import { ILessonGroupItemModel } from '../models/lesson-groups/lesson-group-item.model';
import { CreateLessonGroupRequestDto } from '../dto/lesson-groups/create-lesson-group-request.dto';
import { EditLessonGroupRequestDto } from '../dto/lesson-groups/edit-lesson-group-request.dto';
import { GenerateLessonSeriesRequestDto } from '../dto/lesson-groups/generate-lesson-series-request.dto';
import { CreateLessonGroupWithLessonsRequestDto } from '../dto/lesson-groups/create-lesson-group-with-lessons-request.dto';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';
import { ILessonGroupWithLessonsModel } from '../models/lesson-groups/lesson-group-with-lessons.model';
import { LESSON_MANAGE_PERMISSIONS } from '../services/lesson-access.service';
import { ManagedLessonGroupsService } from '../services/managed-lesson-groups.service';
import { LessonScope } from '../decorators/lesson-scope.decorator';
import type { ILessonManageScopeModel } from '../models/lesson-manage-scope.model';


@ApiTags('Lessons Groups')
@Controller('api/lessons-groups')
export class LessonsGroupsController {
  constructor(
    private readonly managedLessonGroupsService: ManagedLessonGroupsService,
  ) {}

  @Get('list')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async getLessonGroups(@Query() params: GetLessonGroupsRequestDto): Promise<IGenericListPayloadResponse<ILessonGroupListItemModel>> {
    return await this.managedLessonGroupsService.getAll(params);
  }

  @Get('list/:lessonGroupId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async getLessonGroup(@Param('lessonGroupId') lessonGroupId: string): Promise<ILessonGroupItemModel> {
    return await this.managedLessonGroupsService.getById(lessonGroupId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(...LESSON_MANAGE_PERMISSIONS)
  async createLessonGroup(
    @Body() dto: CreateLessonGroupRequestDto,
    @LessonScope() scope: ILessonManageScopeModel,
  ): Promise<ILessonGroupItemModel> {
    return await this.managedLessonGroupsService.createLessonGroup(dto, scope);
  }

  @Post('with-lessons')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(...LESSON_MANAGE_PERMISSIONS)
  async createLessonGroupWithLessons(
    @Body() dto: CreateLessonGroupWithLessonsRequestDto,
    @LessonScope() scope: ILessonManageScopeModel,
  ): Promise<ILessonGroupWithLessonsModel> {
    return await this.managedLessonGroupsService.createLessonGroupWithLessons(dto, scope);
  }

  @Post('generate-series')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(...LESSON_MANAGE_PERMISSIONS)
  async generateLessonSeries(
    @Body() dto: GenerateLessonSeriesRequestDto,
    @LessonScope() scope: ILessonManageScopeModel,
  ): Promise<ILessonItemModel[]> {
    return await this.managedLessonGroupsService.generateLessonSeries(dto, scope);
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
    return await this.managedLessonGroupsService.editLessonGroup(lessonGroupId, dto, scope);
  }

  @Delete(':lessonGroupId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(...LESSON_MANAGE_PERMISSIONS)
  async deleteLessonGroup(
    @Param('lessonGroupId') lessonGroupId: string,
    @LessonScope() scope: ILessonManageScopeModel,
  ): Promise<ILessonGroupItemModel> {
    return await this.managedLessonGroupsService.deleteLessonGroup(lessonGroupId, scope);
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
    return await this.managedLessonGroupsService.assignLessonToGroup(lessonGroupId, lessonId, scope);
  }
}
