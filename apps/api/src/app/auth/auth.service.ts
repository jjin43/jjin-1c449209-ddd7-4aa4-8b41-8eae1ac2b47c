import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    console.error('[AuthService] validateUser called', { email, pwdType: typeof password, pwdLen: password ? password.length : 0 });
    if (typeof password !== 'string' || password.length === 0) {
      console.error('[AuthService] missing/invalid password supplied for', { email });
      return null;
    }
    const user = await this.usersRepo.findOneBy({ email });
    if (!user) return null;
    if (!user.passwordHash) {
      // defensive: avoid passing undefined to bcrypt.compare which throws
      console.error('[AuthService] user has no passwordHash:', { email, userId: user.id });
      return null;
    }
    let match = false;
    try {
      match = await bcrypt.compare(password, user.passwordHash);
    } catch (err) {
      console.error('[AuthService] bcrypt.compare failed', err);
      return null;
    }
    if (!match) return null;
    const { passwordHash, ...rest } = user as any;
    return rest;
  }

  async login(user: Partial<User>) {
    const payload = { sub: user.id, email: user.email, role: user.role, organizationId: user.organizationId };
    return { access_token: this.jwtService.sign(payload) };
  }

  async register(email: string, password: string, role: string, organizationId: string) {
    const existing = await this.usersRepo.findOneBy({ email });
    if (existing) throw new UnauthorizedException('Email already in use');
    const hash = await bcrypt.hash(password, 10);
    const user = this.usersRepo.create({ email, passwordHash: hash, role: role as any, organizationId });
    return this.usersRepo.save(user);
  }
}
