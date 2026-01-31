import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
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

@ApiTags('Lessons')
@Controller('api/lessons')
export class LessonsController {
  constructor(
    private readonly lessonsService: LessonsService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async getLessons(@Query() query: GetLessonsRequestDto): Promise<IGenericListPayloadResponse<ILessonListItemModel>> {
    return await this.lessonsService.getAll(query);
  }

  @Get(':lessonId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async getLessonById(@Param('lessonId') id: string): Promise<ILessonItemModel> {
    return await this.lessonsService.getById(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.ADMIN)
  async createLesson(@Body() dto: CreateLessonRequestDto): Promise<ILessonItemModel> {
    return await this.lessonsService.createLesson(dto);
  }

  @Put(':lessonId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.ADMIN)
  async editLesson(@Param('lessonId') id: string, dto: EditLessonRequestDto): Promise<ILessonItemModel> {
    return await this.lessonsService.editLesson(id, dto);
  }

  @Delete(':lessonId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.ADMIN)
  async deleteLesson(@Param('lessonId') id: string): Promise<void> {
    return await this.lessonsService.deleteLesson(id);
  }
}
