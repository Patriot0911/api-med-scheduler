import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAccessGuard } from "src/modules/auth/guards/access-refresh.guard";
import { CurrentUser } from 'src/modules/auth/decorator/current-user.decorator';
import type { IAccessTokenPayload } from 'src/modules/auth/models/access-token-payload.model';
import { MyLessonsService } from '../services/my-lessons.service';
import { LessonsFiltersRequestDto } from '../dto/lessons/lessons-filters-request.dto';
import { TeacherUpdateLessonRequestDto } from '../dto/lessons/teacher-update-lesson-request.dto';
import { ILessonListItemModel } from '../models/lessons/lesson-list-item.model';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';

/** The user's own lessons: taught by them (teacher) or scheduled for their group (student). */
@ApiTags('My Lessons')
@Controller('api/lessons-my')
export class MyLessonsController {
  constructor(
    private readonly myLessonsService: MyLessonsService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async getMyLessons(
    @Query() query: LessonsFiltersRequestDto,
    @CurrentUser() { sub, }: IAccessTokenPayload,
  ): Promise<ILessonListItemModel[]> {
    return await this.myLessonsService.getMyLessons(sub, query);
  }

  @Get(':lessonId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async getMyLesson(
    @Param('lessonId') lessonId: string,
    @CurrentUser() { sub, }: IAccessTokenPayload,
  ): Promise<ILessonItemModel> {
    return await this.myLessonsService.getMyLesson(sub, lessonId);
  }

  @Patch(':lessonId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async updateMyLesson(
    @Param('lessonId') lessonId: string,
    @Body() dto: TeacherUpdateLessonRequestDto,
    @CurrentUser() { sub, }: IAccessTokenPayload,
  ): Promise<ILessonItemModel> {
    return await this.myLessonsService.updateMyLesson(sub, lessonId, dto);
  }
}
