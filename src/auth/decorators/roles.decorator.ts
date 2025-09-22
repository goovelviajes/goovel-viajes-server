import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = 'roles';

/**
 * Decorador @Roles()
 * Permite indicar qué roles pueden acceder a un endpoint
 * Se usa así: @Roles('admin', 'superadmin')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);