import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessGuard } from 'src/modules/auth/guards/access-refresh.guard';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { GetLessonGroupsRequestDto } from '../dto/lesson-groups/get-lesson-groups-request.dto';
import { CreateLessonGroupRequestDto } from '../dto/lesson-groups/create-lesson-group-request.dto';
import { EditLessonGroupRequestDto } from '../dto/lesson-groups/edit-lesson-group-request.dto';
import { GenerateLessonSeriesRequestDto } from '../dto/lesson-groups/generate-lesson-series-request.dto';
import { AddLessonsToGroupRequestDto, CreateLessonGroupWithLessonsRequestDto } from '../dto/lesson-groups/create-lesson-group-with-lessons-request.dto';
import { ILessonGroupListItemModel } from '../models/lesson-groups/lesson-group-list-item.model';
import { ILessonGroupItemModel } from '../models/lesson-groups/lesson-group-item.model';
import { ILessonGroupWithLessonsModel } from '../models/lesson-groups/lesson-group-with-lessons.model';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';
import { ILessonGroupDictionaryItem } from '../models/lesson-groups/lesson-group-dictionary-item.model';
import { ManagedLessonGroupsService } from '../services/managed-lesson-groups.service';
import { LessonActor } from '../decorators/lesson-actor.decorator';
import type { ILessonActorModel } from '../models/lesson-actor.model';

/** Teacher domain, see LessonAccessService. Admins work with all groups through /admin/lessons-groups. */
@ApiTags('Lessons Groups')
@Controller('api/lessons-groups')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
export class LessonsGroupsController {
  constructor(
    private readonly managedLessonGroupsService: ManagedLessonGroupsService,
  ) {}

  @Get('list')
  async getLessonGroups(@Query() params: GetLessonGroupsRequestDto): Promise<IGenericListPayloadResponse<ILessonGroupListItemModel>> {
    return await this.managedLessonGroupsService.getAll(params);
  }

  @Get('my')
  async getOwnLessonGroups(@LessonActor() actor: ILessonActorModel): Promise<ILessonGroupDictionaryItem[]> {
    return await this.managedLessonGroupsService.getOwn(actor);
  }

  @Get('usable')
  async getUsableLessonGroups(@LessonActor() actor: ILessonActorModel): Promise<ILessonGroupDictionaryItem[]> {
    return await this.managedLessonGroupsService.getUsable(actor);
  }

  @Get('list/:lessonGroupId')
  async getLessonGroup(@Param('lessonGroupId') lessonGroupId: string): Promise<ILessonGroupItemModel> {
    return await this.managedLessonGroupsService.getById(lessonGroupId);
  }

  @Post()
  async createLessonGroup(
    @Body() dto: CreateLessonGroupRequestDto,
    @LessonActor() actor: ILessonActorModel,
  ): Promise<ILessonGroupItemModel> {
    return await this.managedLessonGroupsService.createLessonGroup(dto, actor);
  }

  @Post('with-lessons')
  async createLessonGroupWithLessons(
    @Body() dto: CreateLessonGroupWithLessonsRequestDto,
    @LessonActor() actor: ILessonActorModel,
  ): Promise<ILessonGroupWithLessonsModel> {
    return await this.managedLessonGroupsService.createLessonGroupWithLessons(dto, actor);
  }

  @Post('generate-series')
  async generateLessonSeries(
    @Body() dto: GenerateLessonSeriesRequestDto,
    @LessonActor() actor: ILessonActorModel,
  ): Promise<ILessonItemModel[]> {
    return await this.managedLessonGroupsService.generateLessonSeries(dto, actor);
  }

  @Put(':lessonGroupId')
  async editLessonGroup(
    @Param('lessonGroupId') lessonGroupId: string,
    @Body() dto: EditLessonGroupRequestDto,
    @LessonActor() actor: ILessonActorModel,
  ): Promise<boolean> {
    return await this.managedLessonGroupsService.editLessonGroup(lessonGroupId, dto, actor);
  }

  @Delete(':lessonGroupId')
  async deleteLessonGroup(
    @Param('lessonGroupId') lessonGroupId: string,
    @LessonActor() actor: ILessonActorModel,
  ): Promise<ILessonGroupItemModel> {
    return await this.managedLessonGroupsService.deleteLessonGroup(lessonGroupId, actor);
  }

  @Post(':lessonGroupId/lessons')
  async addLessonsToGroup(
    @Param('lessonGroupId') lessonGroupId: string,
    @Body() dto: AddLessonsToGroupRequestDto,
    @LessonActor() actor: ILessonActorModel,
  ): Promise<ILessonItemModel[]> {
    return await this.managedLessonGroupsService.addLessonsToGroup(lessonGroupId, dto, actor);
  }

  @Put(':lessonGroupId/lessons/:lessonId')
  async assignLessonToGroup(
    @Param('lessonGroupId') lessonGroupId: string,
    @Param('lessonId') lessonId: string,
    @LessonActor() actor: ILessonActorModel,
  ): Promise<boolean> {
    return await this.managedLessonGroupsService.assignLessonToGroup(lessonGroupId, lessonId, actor);
  }
}
