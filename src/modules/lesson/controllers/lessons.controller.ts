import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessGuard } from 'src/modules/auth/guards/access-refresh.guard';
import { OptionalJwtAccessGuard } from 'src/modules/auth/guards/optional-jwt-access.guard';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { GetLessonsRequestDto } from '../dto/lessons/get-lessons-request.dto';
import { LessonsFiltersRequestDto } from '../dto/lessons/lessons-filters-request.dto';
import { CreateLessonRequestDto } from '../dto/lessons/create-lesson-request.dto';
import { EditLessonRequestDto } from '../dto/lessons/edit-lesson-request.dto';
import { ILessonListItemModel } from '../models/lessons/lesson-list-item.model';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';
import { ManagedLessonsService } from '../services/managed-lessons.service';
import { MyLessonsService } from '../services/my-lessons.service';
import { LessonActor } from '../decorators/lesson-actor.decorator';
import type { ILessonActorModel } from '../models/lesson-actor.model';

/** Teacher domain, see LessonAccessService. Admins work with all lessons through /admin/lessons. */
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
    @LessonActor() actor: ILessonActorModel,
  ): Promise<IGenericListPayloadResponse<ILessonListItemModel>> {
    return await this.managedLessonsService.getLessons(query, actor);
  }

  @Get('list/:lessonId')
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAccessGuard)
  async getLesson(
    @Param('lessonId') lessonId: string,
    @LessonActor() actor: ILessonActorModel,
  ): Promise<ILessonItemModel> {
    return await this.managedLessonsService.getLesson(lessonId, actor);
  }

  @Get('my')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async getMyLessons(
    @Query() query: LessonsFiltersRequestDto,
    @LessonActor() actor: ILessonActorModel,
  ): Promise<ILessonListItemModel[]> {
    return await this.myLessonsService.getMyLessons(actor, query);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async createLesson(
    @Body() dto: CreateLessonRequestDto,
    @LessonActor() actor: ILessonActorModel,
  ): Promise<ILessonItemModel> {
    return await this.managedLessonsService.createLesson(dto, actor);
  }

  @Patch(':lessonId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async editLesson(
    @Param('lessonId') lessonId: string,
    @Body() dto: EditLessonRequestDto,
    @LessonActor() actor: ILessonActorModel,
  ): Promise<ILessonItemModel> {
    return await this.managedLessonsService.editLesson(lessonId, dto, actor);
  }

  @Delete(':lessonId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async deleteLesson(
    @Param('lessonId') lessonId: string,
    @LessonActor() actor: ILessonActorModel,
  ): Promise<void> {
    return await this.managedLessonsService.deleteLesson(lessonId, actor);
  }
}
