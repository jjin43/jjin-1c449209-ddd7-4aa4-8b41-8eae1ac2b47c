import { RolesGuard } from '../../src/lib/roles.guard';

function makeCtx(userRole: string | null = null) {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user: userRole ? { role: userRole } : undefined }) }),
  } as any;
}

describe('RolesGuard', () => {
  it('allows when no required roles', () => {
    const reflector = { getAllAndOverride: () => undefined } as any;
    const g = new RolesGuard(reflector);
    expect(g.canActivate(makeCtx('VIEWER'))).toBe(true);
  });

  it('allows when user rank >= required', () => {
    const reflector = { getAllAndOverride: () => ['ADMIN'] } as any;
    const g = new RolesGuard(reflector);
    expect(g.canActivate(makeCtx('OWNER'))).toBe(true);
  });

  it('denies when user rank too low', () => {
    const reflector = { getAllAndOverride: () => ['ADMIN'] } as any;
    const g = new RolesGuard(reflector);
    expect(g.canActivate(makeCtx('VIEWER'))).toBe(false);
  });
});
