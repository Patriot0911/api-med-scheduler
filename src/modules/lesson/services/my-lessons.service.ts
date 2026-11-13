import { Injectable } from '@nestjs/common';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { IGetMyLessonsFiltersModel } from '../models/lessons/get-my-lessons-filter.model';
import { ILessonListItemModel } from '../models/lessons/lesson-list-item.model';
import { ILessonActorModel } from '../models/lesson-actor.model';
import { LessonScope } from '../models/lesson-scope.enum';
import { LessonsService } from './lessons.service';
import { LessonAccessService } from './lesson-access.service';
import { ManagedLessonsService } from './managed-lessons.service';

const DEFAULT_SCOPES = [LessonScope.TEACHING, LessonScope.STUDYING];

@Injectable()
export class MyLessonsService {
  constructor(
    private readonly lessonsService: LessonsService,
    private readonly lessonAccessService: LessonAccessService,
    private readonly managedLessonsService: ManagedLessonsService,
  ) {}

  async getMyLessons(actor: ILessonActorModel, filters: IGetMyLessonsFiltersModel): Promise<IGenericListPayloadResponse<ILessonListItemModel>> {
    const lessonsQb = this.lessonAccessService.applyScope(
      this.lessonsService.buildLessonsQuery(filters),
      actor,
      filters.scope ? [filters.scope] : DEFAULT_SCOPES,
    );
    const page = await this.lessonsService.getPage(lessonsQb, filters);
    return { ...page, items: page.items.map((item) => this.managedLessonsService.withCanEdit(actor, item)), };
  }
}
