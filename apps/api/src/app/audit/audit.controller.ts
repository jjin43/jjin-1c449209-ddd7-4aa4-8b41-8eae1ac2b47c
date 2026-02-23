import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { Roles } from '@jjin-1c449209-ddd7-4aa4-8b41-8eae1ac2b47c/auth';
import { RolesGuard } from '@jjin-1c449209-ddd7-4aa4-8b41-8eae1ac2b47c/auth';

@UseGuards(RolesGuard)
@Controller('audit-log')
export class AuditController {
  constructor(private audit: AuditService) {}

  @Roles('ADMIN')
  @Get()
  async list(@Request() req: any) {
    return this.audit.findByOrg(req.user.organizationId);
  }
}
