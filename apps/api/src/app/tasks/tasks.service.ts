import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { Permission } from '../entities/permission.entity';
import { User } from '../entities/user.entity';
import { AuditService } from '../audit/audit.service';

type Action = 'edit' | 'delete';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private repo: Repository<Task>,
    @InjectRepository(Permission) private permissionRepo: Repository<Permission>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private auditService: AuditService,
  ) {}

  async findAll(user: any) {
    const list = await this.repo.find({ where: { organizationId: user.organizationId, role: user.role as any } });
    try {
      await this.auditService.log(user.userId ?? '', 'list_tasks', 'task', null, user.organizationId);
    } catch (e) {
      console.warn('audit log failed', e);
    }

    const out = await Promise.all(
      list.map(async (t) => {
        const canEdit = await this.isAllowed(t.id, user, 'edit', t);
        const canDelete = await this.isAllowed(t.id, user, 'delete', t);
        return { ...t, canEdit, canDelete } as any;
      }),
    );
    return out;
  }

  async findOne(id: string, user: any) {
    const t = await this.repo.findOneBy({ id, organizationId: user.organizationId, role: user.role as any });
    if (!t) throw new NotFoundException('Task not found');
    try {
      await this.auditService.log(user.userId ?? '', 'read', 'task', id, user.organizationId);
    } catch (e) {
      console.warn('audit log failed', e);
    }
    const canEdit = await this.isAllowed(id, user, 'edit', t);
    const canDelete = await this.isAllowed(id, user, 'delete', t);
    return { ...t, canEdit, canDelete } as any;
  }

  async create(dto: any, user: any) {
    const task = this.repo.create({
      ...dto,
      organizationId: user.organizationId,
      createdById: user.userId,
      role: dto.role ?? user.role,
    } as any);
    const saved = await this.repo.save(task as any);

    // create permission rows: ensure creator has full rights and include any provided permissions
    const provided: any[] = Array.isArray(dto.permissions) ? dto.permissions : [];
    const creatorPerm = { userId: user.userId, canEdit: true, canDelete: true };
    const perms: Array<{ userId: string; canEdit?: boolean; canDelete?: boolean }> = [creatorPerm];

    const seen = new Set<string>();
    seen.add(String(user.userId));

    for (const p of provided) {
      let uid = p.userId;
      if (!uid && p.email) {
        const u = await this.userRepo.findOneBy({ email: p.email, organizationId: user.organizationId } as any);
        if (u) uid = u.id;
      }
      if (!uid) continue; // skip unresolved emails
      if (seen.has(uid)) continue;
      seen.add(uid);
      perms.push({ userId: uid, canEdit: !!p.canEdit, canDelete: !!p.canDelete });
    }

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
    // If permissions provided, replace permission rows for this task
    if (Array.isArray(dto.permissions)) {
      // remove existing permissions
      await this.permissionRepo.delete({ taskId: saved.id } as any);
      const provided: any[] = dto.permissions || [];
      const creatorPerm = { userId: user.userId, canEdit: true, canDelete: true };
      const perms: Array<{ userId: string; canEdit?: boolean; canDelete?: boolean }> = [creatorPerm];
      const seen = new Set<string>();
      seen.add(String(user.userId));
      for (const p of provided) {
        let uid = p.userId;
        if (!uid && p.email) {
          const u = await this.userRepo.findOneBy({ email: p.email, organizationId: user.organizationId } as any);
          if (u) uid = u.id;
        }
        if (!uid) continue;
        if (seen.has(uid)) continue;
        seen.add(uid);
        perms.push({ userId: uid, canEdit: !!p.canEdit, canDelete: !!p.canDelete });
      }
      for (const p of perms) {
        const ent = this.permissionRepo.create({ taskId: saved.id, userId: p.userId, canEdit: !!p.canEdit, canDelete: !!p.canDelete } as any);
        await this.permissionRepo.save(ent);
      }
    }
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
