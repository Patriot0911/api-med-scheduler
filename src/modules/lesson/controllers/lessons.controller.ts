import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAccessGuard } from "src/modules/auth/guards/access-refresh.guard";
import { LessonsService } from "../services/lessons.service";
import { GetLessonsRequestDto } from '../dto/lessons/get-lessons-request.dto';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { ILessonListItemModel } from '../models/lessons/lesson-list-item.model';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';
import { PermissionsGuard } from 'src/modules/auth/guards/permission.guard';
import { Permissions } from 'src/modules/auth/decorator/roles.decorator';
import { Permission } from 'src/shared/models/permission.enum';
import { CreateLessonRequestDto } from '../dto/lessons/create-lesson-request.dto';
import { EditLessonRequestDto } from '../dto/lessons/edit-lesson-request.dto';
import { TeacherUpdateLessonRequestDto } from '../dto/lessons/teacher-update-lesson-request.dto';
import { IAccessTokenPayload } from 'src/modules/auth/models/access-token-payload.model';

@ApiTags('Lessons')
@Controller('api/lessons')
export class LessonsController {
  constructor(
    private readonly lessonsService: LessonsService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async getLessons(@Query() query: GetLessonsRequestDto, @Req() request): Promise<IGenericListPayloadResponse<ILessonListItemModel>> {
    const { sub, permissions, } = <IAccessTokenPayload> request.user;
    return await this.lessonsService.getAll(query, sub, permissions);
  }

  @Get(':lessonId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async getLessonById(@Param('lessonId') id: string, @Req() request): Promise<ILessonItemModel> {
    const { sub, permissions, } = <IAccessTokenPayload> request.user;
    return await this.lessonsService.getByIdForUser(id, sub, permissions);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.ADMIN, Permission.MANAGE_LESSONS)
  async createLesson(@Body() dto: CreateLessonRequestDto): Promise<ILessonItemModel> {
    return await this.lessonsService.createLesson(dto);
  }

  @Patch(':lessonId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.ADMIN, Permission.MANAGE_LESSONS)
  async editLesson(@Param('lessonId') id: string, @Body() dto: EditLessonRequestDto): Promise<ILessonItemModel> {
    return await this.lessonsService.editLesson(id, dto);
  }

  @Delete(':lessonId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.ADMIN, Permission.MANAGE_LESSONS)
  async deleteLesson(@Param('lessonId') id: string): Promise<void> {
    return await this.lessonsService.deleteLesson(id);
  }

  @Patch(':lessonId/teacher-update')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async updateLessonAsTeacher(
    @Req() request,
    @Param('lessonId') id: string,
    @Body() dto: TeacherUpdateLessonRequestDto,
  ): Promise<ILessonItemModel> {
    const { sub, permissions, } = <IAccessTokenPayload> request.user;
    return await this.lessonsService.updateLessonAsTeacher(id, sub, permissions, dto);
  }
}
