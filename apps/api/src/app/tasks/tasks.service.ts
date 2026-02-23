import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { Permission } from '../entities/permission.entity';
import { AuditService } from '../audit/audit.service';

type Action = 'edit' | 'delete';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private repo: Repository<Task>,
    @InjectRepository(Permission) private permissionRepo: Repository<Permission>,
    private auditService: AuditService,
  ) {}

  async findAll(orgId: string, role: string) {
    const list = await this.repo.find({ where: { organizationId: orgId, role: role as any } });
    try {
      await this.auditService.log('', 'list_tasks', 'task', null, orgId);
    } catch (e) {
      console.warn('audit log failed', e);
    }
    return list;
  }

  async findOne(id: string, orgId: string, role: string) {
    const t = await this.repo.findOneBy({ id, organizationId: orgId, role: role as any });
    if (!t) throw new NotFoundException('Task not found');
    try {
      await this.auditService.log('', 'read', 'task', id, orgId);
    } catch (e) {
      console.warn('audit log failed', e);
    }
    return t;
  }

  async create(dto: any, user: any) {
    const task = this.repo.create({
      ...dto,
      organizationId: user.organizationId,
      createdById: user.userId,
      role: dto.role ?? 'VIEWER',
    } as any);
    const saved = await this.repo.save(task as any);

    // create permission rows: ensure creator has full rights and include any provided permissions
    const provided: any[] = Array.isArray(dto.permissions) ? dto.permissions : [];
    const creatorPerm = { userId: user.userId, canEdit: true, canDelete: true };
    const perms = [creatorPerm, ...provided.filter(p => p.userId !== user.userId)];
    for (const p of perms) {
      const ent = this.permissionRepo.create({ taskId: saved.id, userId: p.userId, canEdit: !!p.canEdit, canDelete: !!p.canDelete } as any);
      await this.permissionRepo.save(ent);
    }

    try {
      await this.auditService.log(user.userId, 'create', 'task', saved.id, user.organizationId);
    } catch (e) {
      console.warn('audit log failed', e);
    }

    return saved;
  }

  async update(id: string, dto: any, user: any) {
    const task = await this.repo.findOneBy({ id, organizationId: user.organizationId });
    if (!task) throw new NotFoundException('Task not found');
    const allowed = await this.isAllowed(id, user, 'edit', task);
    if (!allowed) throw new ForbiddenException('Not permitted to edit this task');
    Object.assign(task, dto, { updatedAt: new Date().toISOString() } as any);
    const saved = await this.repo.save(task as any);
    try {
      await this.auditService.log(user.userId, 'update', 'task', id, user.organizationId);
    } catch (e) {
      console.warn('audit log failed', e);
    }
    return saved;
  }

  async remove(id: string, user: any) {
    const task = await this.repo.findOneBy({ id, organizationId: user.organizationId });
    if (!task) throw new NotFoundException('Task not found');
    const allowed = await this.isAllowed(id, user, 'delete', task);
    if (!allowed) throw new ForbiddenException('Not permitted to delete this task');
    const res = await this.repo.delete({ id, organizationId: user.organizationId } as any);
    if (!res.affected) throw new NotFoundException('Task not found');
    try {
      await this.auditService.log(user.userId, 'delete', 'task', id, user.organizationId);
    } catch (e) {
      console.warn('audit log failed', e);
    }
    return { deleted: true };
  }

  private async isAllowed(taskId: string, user: any, action: Action, task?: Task) {
    // Shortcut: OWNER and ADMIN can edit/delete
    if (user.role === 'OWNER' || user.role === 'ADMIN') return true;

    // Creator can edit/delete
    if (!task) task = await this.repo.findOneBy({ id: taskId } as any);
    if (task && user.userId === task.createdById) return true;

    // Check explicit permission
    const perm = await this.permissionRepo.findOneBy({ taskId: taskId, userId: user.userId } as any);
    if (!perm) return false;
    return action === 'edit' ? !!perm.canEdit : !!perm.canDelete;
  }
}
