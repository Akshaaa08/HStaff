import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: ('client' | 'worker' | 'admin')[]) =>
  SetMetadata(ROLES_KEY, roles);
