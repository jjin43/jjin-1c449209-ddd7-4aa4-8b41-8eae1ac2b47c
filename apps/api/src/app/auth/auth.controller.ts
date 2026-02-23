import { Controller, Post, Body, UnauthorizedException, UseGuards, Request, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from './public.decorator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const out = await this.authService.login(user as any);
    const token = (out && (out as any).access_token) || null;
    if (token) {
      // set HttpOnly cookie
      res.cookie('jid', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      });
    }
    // return basic user info (no token in body)
    return { id: user.id, email: user.email, role: user.role, organizationId: user.organizationId };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: any) {
    return req.user;
  }

  @Public()
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    // Clear the HttpOnly cookie set at login
    res.clearCookie('jid', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return { ok: true };
  }
}
