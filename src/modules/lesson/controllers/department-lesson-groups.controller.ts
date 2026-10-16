import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAccessGuard } from "src/modules/auth/guards/access-refresh.guard";
import { PermissionsGuard } from 'src/modules/auth/guards/permission.guard';
import { Permissions } from 'src/modules/auth/decorator/roles.decorator';
import { CurrentUser } from 'src/modules/auth/decorator/current-user.decorator';
import type { IAccessTokenPayload } from 'src/modules/auth/models/access-token-payload.model';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { DepartmentLessonGroupsService } from '../services/department-lesson-groups.service';
import { LESSON_MANAGE_PERMISSIONS } from '../services/lesson-access.service';
import { LessonScope } from '../decorators/lesson-scope.decorator';
import type { ILessonManageScopeModel } from '../models/lesson-manage-scope.model';
import { GetLessonGroupsRequestDto } from '../dto/lesson-groups/get-lesson-groups-request.dto';
import { CreateLessonGroupRequestDto } from '../dto/lesson-groups/create-lesson-group-request.dto';
import { EditLessonGroupRequestDto } from '../dto/lesson-groups/edit-lesson-group-request.dto';
import { GenerateLessonSeriesRequestDto } from '../dto/lesson-groups/generate-lesson-series-request.dto';
import { CreateLessonGroupWithLessonsRequestDto } from '../dto/lesson-groups/create-lesson-group-with-lessons-request.dto';
import { ILessonGroupListItemModel } from '../models/lesson-groups/lesson-group-list-item.model';
import { ILessonGroupItemModel } from '../models/lesson-groups/lesson-group-item.model';
import { ILessonGroupWithLessonsModel } from '../models/lesson-groups/lesson-group-with-lessons.model';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';

/** Lesson groups within a department: reading for its members, managing within the lesson scope. */
@ApiTags('Department Lesson Groups')
@Controller('api/departments/:departmentId/lesson-groups')
export class DepartmentLessonGroupsController {
  constructor(
    private readonly departmentLessonGroupsService: DepartmentLessonGroupsService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async getAllLessonGroups(
    @Param('departmentId') departmentId: string,
    @Query() params: GetLessonGroupsRequestDto,
    @CurrentUser() { sub, permissions, }: IAccessTokenPayload,
  ): Promise<IGenericListPayloadResponse<ILessonGroupListItemModel>> {
    return await this.departmentLessonGroupsService.getAll(departmentId, params, sub, permissions);
  }

  @Get(':lessonGroupId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async getLessonGroup(
    @Param('departmentId') departmentId: string,
    @Param('lessonGroupId') lessonGroupId: string,
    @CurrentUser() { sub, permissions, }: IAccessTokenPayload,
  ): Promise<ILessonGroupItemModel> {
    return await this.departmentLessonGroupsService.getById(departmentId, lessonGroupId, sub, permissions);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(...LESSON_MANAGE_PERMISSIONS)
  async createLessonGroup(
    @Param('departmentId') departmentId: string,
    @Body() dto: CreateLessonGroupRequestDto,
    @LessonScope() scope: ILessonManageScopeModel,
  ): Promise<ILessonGroupItemModel> {
    return await this.departmentLessonGroupsService.createLessonGroup(departmentId, dto, scope);
  }

  @Post('with-lessons')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(...LESSON_MANAGE_PERMISSIONS)
  async createLessonGroupWithLessons(
    @Param('departmentId') departmentId: string,
    @Body() dto: CreateLessonGroupWithLessonsRequestDto,
    @LessonScope() scope: ILessonManageScopeModel,
  ): Promise<ILessonGroupWithLessonsModel> {
    return await this.departmentLessonGroupsService.createLessonGroupWithLessons(departmentId, dto, scope);
  }

  @Post('generate-series')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(...LESSON_MANAGE_PERMISSIONS)
  async generateLessonSeries(
    @Param('departmentId') departmentId: string,
    @Body() dto: GenerateLessonSeriesRequestDto,
    @LessonScope() scope: ILessonManageScopeModel,
  ): Promise<ILessonItemModel[]> {
    return await this.departmentLessonGroupsService.generateLessonSeries(departmentId, dto, scope);
  }

  @Put(':lessonGroupId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(...LESSON_MANAGE_PERMISSIONS)
  async editLessonGroup(
    @Param('departmentId') departmentId: string,
    @Param('lessonGroupId') lessonGroupId: string,
    @Body() dto: EditLessonGroupRequestDto,
    @LessonScope() scope: ILessonManageScopeModel,
  ): Promise<boolean> {
    return await this.departmentLessonGroupsService.editLessonGroup(departmentId, lessonGroupId, dto, scope);
  }

  @Delete(':lessonGroupId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(...LESSON_MANAGE_PERMISSIONS)
  async deleteLessonGroup(
    @Param('departmentId') departmentId: string,
    @Param('lessonGroupId') lessonGroupId: string,
    @LessonScope() scope: ILessonManageScopeModel,
  ): Promise<ILessonGroupItemModel> {
    return await this.departmentLessonGroupsService.deleteLessonGroup(departmentId, lessonGroupId, scope);
  }

  @Put(':lessonGroupId/lessons/:lessonId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(...LESSON_MANAGE_PERMISSIONS)
  async assignLessonToGroup(
    @Param('departmentId') departmentId: string,
    @Param('lessonGroupId') lessonGroupId: string,
    @Param('lessonId') lessonId: string,
    @LessonScope() scope: ILessonManageScopeModel,
  ): Promise<boolean> {
    return await this.departmentLessonGroupsService.assignLessonToGroup(departmentId, lessonGroupId, lessonId, scope);
  }
}
