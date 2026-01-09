import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { FEATURE_KEY } from '../decorator/features.decorator';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const feature = this.reflector.get<string>(
      FEATURE_KEY,
      ctx.getHandler(),
    );

    if (!feature) return true;

    const enabled = this.configService.get<boolean>(`features.${feature}`);

    if (!enabled) {
      throw new ForbiddenException(`Feature "${feature}" is disabled`);
    }

    return true;
  }
}
