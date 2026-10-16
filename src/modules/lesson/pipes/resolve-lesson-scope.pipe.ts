import { Injectable, PipeTransform } from '@nestjs/common';
import { IAccessTokenPayload } from 'src/modules/auth/models/access-token-payload.model';
import { LessonAccessService } from '../services/lesson-access.service';
import { ILessonManageScopeModel } from '../models/lesson-manage-scope.model';

@Injectable()
export class ResolveLessonScopePipe implements PipeTransform<IAccessTokenPayload, Promise<ILessonManageScopeModel>> {
  constructor(
    private readonly lessonAccessService: LessonAccessService,
  ) {}

  async transform(user: IAccessTokenPayload): Promise<ILessonManageScopeModel> {
    return await this.lessonAccessService.resolveScope(user.sub, user.permissions);
  }
}
