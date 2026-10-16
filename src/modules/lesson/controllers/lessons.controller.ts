import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAccessGuard } from "src/modules/auth/guards/access-refresh.guard";
import { LessonsService } from "../services/lessons.service";
import { GetLessonsRequestDto } from '../dto/lessons/get-lessons-request.dto';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { ILessonListItemModel } from '../models/lessons/lesson-list-item.model';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';
import { PermissionsGuard } from 'src/modules/auth/guards/permission.guard';
import { Permissions } from 'src/modules/auth/decorator/roles.decorator';
import { LESSON_MANAGE_PERMISSIONS } from '../services/lesson-access.service';
import type { ILessonManageScopeModel } from '../models/lesson-manage-scope.model';
import { LessonScope } from '../decorators/lesson-scope.decorator';
import { CurrentUser } from 'src/modules/auth/decorator/current-user.decorator';
import { CreateLessonRequestDto } from '../dto/lessons/create-lesson-request.dto';
import { EditLessonRequestDto } from '../dto/lessons/edit-lesson-request.dto';
import { TeacherUpdateLessonRequestDto } from '../dto/lessons/teacher-update-lesson-request.dto';
import type { IAccessTokenPayload } from 'src/modules/auth/models/access-token-payload.model';

@ApiTags('Lessons')
@Controller('api/lessons')
export class LessonsController {
  constructor(
    private readonly lessonsService: LessonsService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async getLessons(
    @Query() query: GetLessonsRequestDto,
    @CurrentUser() { sub, permissions, }: IAccessTokenPayload
  ): Promise<IGenericListPayloadResponse<ILessonListItemModel>> {
    return await this.lessonsService.getAll(query, sub, permissions);
  }

  @Get(':lessonId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async getLessonById(
    @Param('lessonId') id: string,
    @CurrentUser() { sub, permissions, }: IAccessTokenPayload
  ): Promise<ILessonItemModel> {
    return await this.lessonsService.getByIdForUser(id, sub, permissions);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(...LESSON_MANAGE_PERMISSIONS)
  async createLesson(@Body() dto: CreateLessonRequestDto, @LessonScope() scope: ILessonManageScopeModel): Promise<ILessonItemModel> {
    return await this.lessonsService.createLessonForUser(dto, scope);
  }

  @Patch(':lessonId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(...LESSON_MANAGE_PERMISSIONS)
  async editLesson(@Param('lessonId') id: string, @Body() dto: EditLessonRequestDto, @LessonScope() scope: ILessonManageScopeModel): Promise<ILessonItemModel> {
    return await this.lessonsService.editLessonForUser(id, dto, scope);
  }

  @Delete(':lessonId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(...LESSON_MANAGE_PERMISSIONS)
  async deleteLesson(@Param('lessonId') id: string, @LessonScope() scope: ILessonManageScopeModel): Promise<void> {
    return await this.lessonsService.deleteLessonForUser(id, scope);
  }

  @Patch(':lessonId/teacher-update')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async updateLessonAsTeacher(
    @CurrentUser() { sub, permissions, }: IAccessTokenPayload,
    @Param('lessonId') id: string,
    @Body() dto: TeacherUpdateLessonRequestDto,
  ): Promise<ILessonItemModel> {
    return await this.lessonsService.updateLessonAsTeacher(id, sub, permissions, dto);
  }
}
