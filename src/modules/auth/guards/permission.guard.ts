import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from 'src/shared/models/permission.enum';
import { PERMISSIONS_KEY } from '../decorator/roles.decorator';
import { IAccessTokenPayload } from '../models/access-token-payload.model';

/** Passes with any of the required permissions. Admin holds every permission, so it always passes. */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredPermissions) {
      return true;
    }
    const user = context.switchToHttp().getRequest<{ user?: IAccessTokenPayload }>().user;
    const permissions = user?.permissions ?? [];

    return permissions.includes(Permission.ADMIN)
      || permissions.some((permission) => requiredPermissions.includes(permission));
  }
}
