import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'audit.log');

@Injectable()
export class AuditService {
  private logger = new Logger(AuditService.name);

  private async ensureLogDir() {
    return fs.promises.mkdir(LOG_DIR, { recursive: true }).catch(() => undefined);
  }

  async log(userId: string, action: string, resource: string, resourceId?: string | null, organizationId?: string | null) {
    await this.ensureLogDir();
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      action,
      resource,
      resourceId: resourceId ?? null,
      organizationId: organizationId ?? null,
      timestamp: new Date().toISOString(),
    } as any;

    const line = JSON.stringify(entry) + '\n';
    try {
      await fs.promises.appendFile(LOG_FILE, line, 'utf8');
    } catch (e) {
      this.logger.warn('Failed to write audit log', e as any);
    }

    this.logger.debug('[AUDIT] ' + JSON.stringify(entry));
    return entry;
  }

  async findByOrg(orgId: string) {
    try {
      const data = await fs.promises.readFile(LOG_FILE, 'utf8');
      const lines = data.split(/\r?\n/).filter(Boolean);
      const entries = lines
        .map((l) => {
          try {
            return JSON.parse(l);
          } catch {
            return null;
          }
        })
        .filter(Boolean) as any[];

      const filtered = entries.filter((e) => e.organizationId === orgId);
      filtered.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      return filtered;
    } catch (e) {
      // If file does not exist, return empty list
      if ((e as any)?.code === 'ENOENT') return [];
      this.logger.warn('Failed to read audit log', e as any);
      return [];
    }
  }
}
