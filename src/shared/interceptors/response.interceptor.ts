import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { IGenericDataResponse } from '../models/generic-data.response';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((data) => ({
        status: true,
        data,
      }) as IGenericDataResponse<any>)
    );
  }
}
