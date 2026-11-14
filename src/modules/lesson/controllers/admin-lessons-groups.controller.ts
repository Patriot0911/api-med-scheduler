import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessGuard } from 'src/modules/auth/guards/access-refresh.guard';
import { PermissionsGuard } from 'src/modules/auth/guards/permission.guard';
import { Permissions } from 'src/modules/auth/decorator/roles.decorator';
import { Permission } from 'src/shared/models/permission.enum';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { GetLessonGroupsRequestDto } from '../dto/lesson-groups/get-lesson-groups-request.dto';
import { CreateLessonGroupRequestDto } from '../dto/lesson-groups/create-lesson-group-request.dto';
import { EditLessonGroupRequestDto } from '../dto/lesson-groups/edit-lesson-group-request.dto';
import { DeleteLessonGroupRequestDto } from '../dto/lesson-groups/delete-lesson-group-request.dto';
import { LessonIdsRequestDto } from '../dto/lessons/lesson-ids-request.dto';
import { GenerateLessonSeriesRequestDto } from '../dto/lesson-groups/generate-lesson-series-request.dto';
import { AddLessonsToGroupRequestDto, CreateLessonGroupWithLessonsRequestDto } from '../dto/lesson-groups/create-lesson-group-with-lessons-request.dto';
import { ILessonGroupListItemModel } from '../models/lesson-groups/lesson-group-list-item.model';
import { ILessonGroupItemModel } from '../models/lesson-groups/lesson-group-item.model';
import { ILessonGroupWithLessonsModel } from '../models/lesson-groups/lesson-group-with-lessons.model';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';
import { LessonsGroupsService } from '../services/lessons-groups.service';

/** Admin panel: every lesson group, with no creator / department restrictions */
@ApiTags('Admin: Lessons Groups')
@Controller('api/admin/lessons-groups')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class AdminLessonsGroupsController {
  constructor(
    private readonly lessonsGroupsService: LessonsGroupsService,
  ) {}

  @Get()
  @Permissions(Permission.READ_LESSONS, Permission.MANAGE_LESSONS)
  async getLessonGroups(@Query() params: GetLessonGroupsRequestDto): Promise<IGenericListPayloadResponse<ILessonGroupListItemModel>> {
    return await this.lessonsGroupsService.getAll(params);
  }

  @Get(':lessonGroupId')
  @Permissions(Permission.READ_LESSONS, Permission.MANAGE_LESSONS)
  async getLessonGroup(@Param('lessonGroupId') lessonGroupId: string): Promise<ILessonGroupItemModel> {
    return await this.lessonsGroupsService.getById(lessonGroupId);
  }

  @Post()
  @Permissions(Permission.MANAGE_LESSONS)
  async createLessonGroup(@Body() dto: CreateLessonGroupRequestDto): Promise<ILessonGroupItemModel> {
    return await this.lessonsGroupsService.createLessonGroup(dto, { createdByTeacherId: null, departmentId: dto.departmentId ?? null, });
  }

  @Post('with-lessons')
  @Permissions(Permission.MANAGE_LESSONS)
  async createLessonGroupWithLessons(@Body() dto: CreateLessonGroupWithLessonsRequestDto): Promise<ILessonGroupWithLessonsModel> {
    return await this.lessonsGroupsService.createLessonGroupWithLessons(dto);
  }

  @Post('generate-series')
  @Permissions(Permission.MANAGE_LESSONS)
  async generateLessonSeries(@Body() dto: GenerateLessonSeriesRequestDto): Promise<ILessonItemModel[]> {
    return await this.lessonsGroupsService.generateLessonSeries(dto);
  }

  @Put(':lessonGroupId')
  @Permissions(Permission.MANAGE_LESSONS)
  async editLessonGroup(@Param('lessonGroupId') lessonGroupId: string, @Body() dto: EditLessonGroupRequestDto): Promise<boolean> {
    return await this.lessonsGroupsService.editLessonGroup(dto, lessonGroupId);
  }

  @Delete(':lessonGroupId')
  @Permissions(Permission.MANAGE_LESSONS)
  async deleteLessonGroup(
    @Param('lessonGroupId') lessonGroupId: string,
    @Query() { withLessons, }: DeleteLessonGroupRequestDto,
  ): Promise<ILessonGroupItemModel> {
    return await this.lessonsGroupsService.deleteLessonGroup(lessonGroupId, withLessons);
  }

  @Post(':lessonGroupId/lessons')
  @Permissions(Permission.MANAGE_LESSONS)
  async addLessonsToGroup(@Param('lessonGroupId') lessonGroupId: string, @Body() dto: AddLessonsToGroupRequestDto): Promise<ILessonItemModel[]> {
    return await this.lessonsGroupsService.addLessonsToGroup(lessonGroupId, dto);
  }

  @Put(':lessonGroupId/lessons/:lessonId')
  @Permissions(Permission.MANAGE_LESSONS)
  async assignLessonToGroup(@Param('lessonGroupId') lessonGroupId: string, @Param('lessonId') lessonId: string): Promise<boolean> {
    return await this.lessonsGroupsService.assignLessonToGroup(lessonGroupId, lessonId);
  }

  /** Existing lessons into the group (moved from another group or none); returns how many */
  @Put(':lessonGroupId/lessons')
  @Permissions(Permission.MANAGE_LESSONS)
  async assignLessonsToGroup(@Param('lessonGroupId') lessonGroupId: string, @Body() { lessonIds, }: LessonIdsRequestDto): Promise<number> {
    return await this.lessonsGroupsService.assignLessonsToGroup(lessonGroupId, lessonIds);
  }

  /** Takes the lessons out of the group, they stay without one; returns how many */
  @Post(':lessonGroupId/lessons/remove')
  @Permissions(Permission.MANAGE_LESSONS)
  async removeLessonsFromGroup(@Param('lessonGroupId') lessonGroupId: string, @Body() { lessonIds, }: LessonIdsRequestDto): Promise<number> {
    return await this.lessonsGroupsService.removeLessonsFromGroup(lessonGroupId, lessonIds);
  }
}
