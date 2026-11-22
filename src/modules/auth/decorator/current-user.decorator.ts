import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { IAccessTokenPayload } from '../models/access-token-payload.model';

/** Access-token payload of the authenticated user (requires JwtAccessGuard). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): IAccessTokenPayload => ctx.switchToHttp().getRequest<Request & { user: IAccessTokenPayload }>().user,
);
