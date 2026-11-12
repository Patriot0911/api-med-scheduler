import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessGuard } from 'src/modules/auth/guards/access-refresh.guard';
import { PermissionsGuard } from 'src/modules/auth/guards/permission.guard';
import { Permissions } from 'src/modules/auth/decorator/roles.decorator';
import { Permission } from 'src/shared/models/permission.enum';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { GetLessonsRequestDto } from '../dto/lessons/get-lessons-request.dto';
import { CreateLessonRequestDto } from '../dto/lessons/create-lesson-request.dto';
import { EditLessonRequestDto } from '../dto/lessons/edit-lesson-request.dto';
import { ILessonListItemModel } from '../models/lessons/lesson-list-item.model';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';
import { LessonsService } from '../services/lessons.service';

/** Admin panel: every lesson, whatever its visibility, teachers or department */
@ApiTags('Admin: Lessons')
@Controller('api/admin/lessons')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class AdminLessonsController {
  constructor(
    private readonly lessonsService: LessonsService,
  ) {}

  @Get()
  @Permissions(Permission.READ_LESSONS, Permission.MANAGE_LESSONS)
  async getLessons(@Query() query: GetLessonsRequestDto): Promise<IGenericListPayloadResponse<ILessonListItemModel>> {
    return await this.lessonsService.getPage(this.lessonsService.buildLessonsQuery(query), query);
  }

  @Get(':lessonId')
  @Permissions(Permission.READ_LESSONS, Permission.MANAGE_LESSONS)
  async getLesson(@Param('lessonId') lessonId: string): Promise<ILessonItemModel> {
    return await this.lessonsService.getById(lessonId);
  }

  @Post()
  @Permissions(Permission.MANAGE_LESSONS)
  async createLesson(@Body() dto: CreateLessonRequestDto): Promise<ILessonItemModel> {
    return await this.lessonsService.createLesson(dto);
  }

  @Patch(':lessonId')
  @Permissions(Permission.MANAGE_LESSONS)
  async editLesson(@Param('lessonId') lessonId: string, @Body() dto: EditLessonRequestDto): Promise<ILessonItemModel> {
    return await this.lessonsService.editLesson(lessonId, dto);
  }

  @Delete(':lessonId')
  @Permissions(Permission.MANAGE_LESSONS)
  async deleteLesson(@Param('lessonId') lessonId: string): Promise<void> {
    return await this.lessonsService.deleteLesson(lessonId);
  }
}
