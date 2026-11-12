import { Injectable, PipeTransform } from '@nestjs/common';
import { IAccessTokenPayload } from 'src/modules/auth/models/access-token-payload.model';
import { LessonAccessService } from '../services/lesson-access.service';
import { ILessonActorModel } from '../models/lesson-actor.model';

@Injectable()
export class ResolveLessonActorPipe implements PipeTransform<IAccessTokenPayload | undefined, Promise<ILessonActorModel>> {
  constructor(
    private readonly lessonAccessService: LessonAccessService,
  ) {}

  async transform(user: IAccessTokenPayload | undefined): Promise<ILessonActorModel> {
    return await this.lessonAccessService.resolveActor(user);
  }
}
