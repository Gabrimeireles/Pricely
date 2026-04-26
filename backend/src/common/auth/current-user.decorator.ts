import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { type JwtUserPayload } from '../../auth/auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtUserPayload => {
    const request = context.switchToHttp().getRequest<{ user: JwtUserPayload }>();
    return request.user;
  },
);
