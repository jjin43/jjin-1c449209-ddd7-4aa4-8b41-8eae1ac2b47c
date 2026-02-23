import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  const mockUsersRepo: any = { findOneBy: jest.fn() };
  const mockJwt: any = { sign: jest.fn().mockReturnValue('signed-token') };
  const svc = new AuthService(mockUsersRepo as any, mockJwt as any);

  afterEach(() => jest.clearAllMocks());

  it('validateUser returns null when user not found', async () => {
    mockUsersRepo.findOneBy.mockResolvedValue(null);
    const res = await svc.validateUser('no@x.com', 'pw');
    expect(res).toBeNull();
  });

  it('validateUser returns user data when password matches', async () => {
    const user = { id: 'u1', email: 'a@b', passwordHash: 'hash', role: 'ADMIN', organizationId: 'org1' };
    mockUsersRepo.findOneBy.mockResolvedValue(user);
    (bcrypt as any).compare = jest.fn().mockResolvedValue(true);
    const res = await svc.validateUser('a@b', 'pw');
    expect(res).not.toBeNull();
    expect((res as any).id).toBe('u1');
  });

  it('login returns access_token', async () => {
    const out = await svc.login({ id: 'u1', email: 'e', role: 'VIEWER', organizationId: 'o1' } as any);
    expect(out).toEqual({ access_token: 'signed-token' });
    expect(mockJwt.sign).toHaveBeenCalled();
  });
});
