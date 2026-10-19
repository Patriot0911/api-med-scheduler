import { Injectable, PipeTransform } from '@nestjs/common';
import { IAccessTokenPayload } from 'src/modules/auth/models/access-token-payload.model';
import { LessonAccessService } from '../services/lesson-access.service';
import { ILessonReaderModel } from '../models/lesson-reader.model';

@Injectable()
export class ResolveLessonReaderPipe implements PipeTransform<IAccessTokenPayload | undefined, Promise<ILessonReaderModel>> {
  constructor(
    private readonly lessonAccessService: LessonAccessService,
  ) {}

  async transform(user: IAccessTokenPayload | undefined): Promise<ILessonReaderModel> {
    return await this.lessonAccessService.resolveReader(user);
  }
}
