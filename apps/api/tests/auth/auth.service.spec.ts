import { AuthService } from '../../src/app/auth/auth.service';
import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt so `compare` is a writable mock function (avoids read-only property errors)
jest.mock('bcrypt', () => ({ compare: jest.fn() }));

describe('AuthService', () => {
  // silence Nest Logger output during tests
  jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

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
    (bcrypt as any).compare.mockResolvedValue(true);
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
