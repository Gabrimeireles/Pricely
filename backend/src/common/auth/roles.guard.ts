import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type JwtUserPayload } from '../../auth/auth.types';
import { ROLES_METADATA_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<
      Array<'customer' | 'admin'>
    >(ROLES_METADATA_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: JwtUserPayload }>();

    if (!request.user || !requiredRoles.includes(request.user.role)) {
      throw new ForbiddenException('You do not have access to this resource');
    }

    return true;
  }
}
