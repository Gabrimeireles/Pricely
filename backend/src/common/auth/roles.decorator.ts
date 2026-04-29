import { SetMetadata } from '@nestjs/common';

export const ROLES_METADATA_KEY = 'required_roles';

export const Roles = (...roles: Array<'customer' | 'admin'>) =>
  SetMetadata(ROLES_METADATA_KEY, roles);
