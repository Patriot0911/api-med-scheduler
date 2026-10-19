import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAccessGuard } from "src/modules/auth/guards/access-refresh.guard";
import { OptionalJwtAccessGuard } from 'src/modules/auth/guards/optional-jwt-access.guard';
import { GetLessonsRequestDto } from '../dto/lessons/get-lessons-request.dto';
import { LessonsFiltersRequestDto } from '../dto/lessons/lessons-filters-request.dto';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { ILessonListItemModel } from '../models/lessons/lesson-list-item.model';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';
import { PermissionsGuard } from 'src/modules/auth/guards/permission.guard';
import { Permissions } from 'src/modules/auth/decorator/roles.decorator';
import { CurrentUser } from 'src/modules/auth/decorator/current-user.decorator';
import type { IAccessTokenPayload } from 'src/modules/auth/models/access-token-payload.model';
import { CreateLessonRequestDto } from '../dto/lessons/create-lesson-request.dto';
import { EditLessonRequestDto } from '../dto/lessons/edit-lesson-request.dto';
import { TeacherUpdateLessonRequestDto } from '../dto/lessons/teacher-update-lesson-request.dto';
import { LESSON_MANAGE_PERMISSIONS } from '../services/lesson-access.service';
import { ManagedLessonsService } from '../services/managed-lessons.service';
import { MyLessonsService } from '../services/my-lessons.service';
import { LessonScope } from '../decorators/lesson-scope.decorator';
import type { ILessonManageScopeModel } from '../models/lesson-manage-scope.model';
import { LessonReader } from '../decorators/lesson-reader.decorator';
import type { ILessonReaderModel } from '../models/lesson-reader.model';

/**
 * Lessons.
 * - list, list/:lessonId: lessons the user may see (anonymous: public only), filtered by query
 *   (visibility, departmentId, teacher, student group, dates).
 * - my: lessons the user teaches or their group attends, regardless of visibility.
 * - create / edit / delete: within the lesson scope (see LessonAccessService).
 */
@ApiTags('Lessons')
@Controller('api/lessons')
export class LessonsController {
  constructor(
    private readonly managedLessonsService: ManagedLessonsService,
    private readonly myLessonsService: MyLessonsService,
  ) {}

  @Get('list')
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAccessGuard)
  async getLessons(
    @Query() query: GetLessonsRequestDto,
    @LessonReader() reader: ILessonReaderModel,
  ): Promise<IGenericListPayloadResponse<ILessonListItemModel>> {
    return await this.managedLessonsService.getLessons(query, reader);
  }

  @Get('list/:lessonId')
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAccessGuard)
  async getLesson(
    @Param('lessonId') lessonId: string,
    @LessonReader() reader: ILessonReaderModel,
  ): Promise<ILessonItemModel> {
    return await this.managedLessonsService.getVisibleLesson(lessonId, reader);
  }

  @Get('my')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async getMyLessons(
    @Query() query: LessonsFiltersRequestDto,
    @CurrentUser() { sub, }: IAccessTokenPayload,
  ): Promise<ILessonListItemModel[]> {
    return await this.myLessonsService.getMyLessons(sub, query);
  }

  /** Any teacher of the lesson may update its note and delayed date. */
  @Patch('my/:lessonId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async updateMyLesson(
    @Param('lessonId') lessonId: string,
    @Body() dto: TeacherUpdateLessonRequestDto,
    @CurrentUser() { sub, }: IAccessTokenPayload,
  ): Promise<ILessonItemModel> {
    return await this.myLessonsService.updateMyLesson(sub, lessonId, dto);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(...LESSON_MANAGE_PERMISSIONS)
  async createLesson(
    @Body() dto: CreateLessonRequestDto,
    @LessonScope() scope: ILessonManageScopeModel,
  ): Promise<ILessonItemModel> {
    return await this.managedLessonsService.createLesson(dto, scope);
  }

  // no permission guard: the owner / editors (teacher_lesson flags) decide
  @Patch(':lessonId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async editLesson(
    @Param('lessonId') lessonId: string,
    @Body() dto: EditLessonRequestDto,
    @LessonScope() scope: ILessonManageScopeModel,
  ): Promise<ILessonItemModel> {
    const lesson = await this.managedLessonsService.getManagedLessonOrFail(lessonId, scope);
    return await this.managedLessonsService.editLesson(lesson, dto, scope);
  }

  @Delete(':lessonId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async deleteLesson(
    @Param('lessonId') lessonId: string,
    @LessonScope() scope: ILessonManageScopeModel,
  ): Promise<void> {
    const lesson = await this.managedLessonsService.getManagedLessonOrFail(lessonId, scope);
    return await this.managedLessonsService.deleteLesson(lesson, scope);
  }
}
