import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

/**
 * Lets anonymous requests through (request.user stays undefined).
 * A request with an Authorization header must carry a valid access token, so expired tokens still get 401.
 */
@Injectable()
export class OptionalJwtAccessGuard extends AuthGuard('jwt-access') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.headers.authorization) {
      return true;
    }
    return super.canActivate(context);
  }
}
