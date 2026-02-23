import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

const ROLE_RANK: Record<string, number> = {
  VIEWER: 1,
  ADMIN: 2,
  OWNER: 3,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // no role metadata, allow
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.role) return false;

    const userRank = ROLE_RANK[user.role] ?? 0;

    // allow if user's rank is >= any required role's rank
    return requiredRoles.some((r) => {
      const reqRank = ROLE_RANK[r] ?? 0;
      return userRank >= reqRank;
    });
  }
}
