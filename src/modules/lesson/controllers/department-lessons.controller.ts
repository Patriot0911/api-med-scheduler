import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAccessGuard } from "src/modules/auth/guards/access-refresh.guard";
import { PermissionsGuard } from 'src/modules/auth/guards/permission.guard';
import { Permissions } from 'src/modules/auth/decorator/roles.decorator';
import { CurrentUser } from 'src/modules/auth/decorator/current-user.decorator';
import type { IAccessTokenPayload } from 'src/modules/auth/models/access-token-payload.model';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { DepartmentLessonsService } from '../services/department-lessons.service';
import { LESSON_MANAGE_PERMISSIONS } from '../services/lesson-access.service';
import { LessonScope } from '../decorators/lesson-scope.decorator';
import type { ILessonManageScopeModel } from '../models/lesson-manage-scope.model';
import { GetLessonsRequestDto } from '../dto/lessons/get-lessons-request.dto';
import { CreateLessonRequestDto } from '../dto/lessons/create-lesson-request.dto';
import { EditLessonRequestDto } from '../dto/lessons/edit-lesson-request.dto';
import { ILessonListItemModel } from '../models/lessons/lesson-list-item.model';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';

/** Lessons within a department: reading for its members, managing within the lesson scope. */
@ApiTags('Department Lessons')
@Controller('api/departments/:departmentId/lessons')
export class DepartmentLessonsController {
  constructor(
    private readonly departmentLessonsService: DepartmentLessonsService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async getLessons(
    @Param('departmentId') departmentId: string,
    @Query() query: GetLessonsRequestDto,
    @CurrentUser() { sub, permissions, }: IAccessTokenPayload,
  ): Promise<IGenericListPayloadResponse<ILessonListItemModel>> {
    return await this.departmentLessonsService.getLessons(departmentId, query, sub, permissions);
  }

  @Get(':lessonId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async getLesson(
    @Param('departmentId') departmentId: string,
    @Param('lessonId') lessonId: string,
    @CurrentUser() { sub, permissions, }: IAccessTokenPayload,
  ): Promise<ILessonItemModel> {
    return await this.departmentLessonsService.getLesson(departmentId, lessonId, sub, permissions);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(...LESSON_MANAGE_PERMISSIONS)
  async createLesson(
    @Param('departmentId') departmentId: string,
    @Body() dto: CreateLessonRequestDto,
    @LessonScope() scope: ILessonManageScopeModel,
  ): Promise<ILessonItemModel> {
    return await this.departmentLessonsService.createLesson(departmentId, dto, scope);
  }

  @Patch(':lessonId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(...LESSON_MANAGE_PERMISSIONS)
  async editLesson(
    @Param('departmentId') departmentId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: EditLessonRequestDto,
    @LessonScope() scope: ILessonManageScopeModel,
  ): Promise<ILessonItemModel> {
    return await this.departmentLessonsService.editLesson(departmentId, lessonId, dto, scope);
  }

  @Delete(':lessonId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(...LESSON_MANAGE_PERMISSIONS)
  async deleteLesson(
    @Param('departmentId') departmentId: string,
    @Param('lessonId') lessonId: string,
    @LessonScope() scope: ILessonManageScopeModel,
  ): Promise<void> {
    return await this.departmentLessonsService.deleteLesson(departmentId, lessonId, scope);
  }
}
