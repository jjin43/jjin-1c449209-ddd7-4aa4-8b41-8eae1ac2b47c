import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditService } from '../../services/audit.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audit-log.component.html',
})
export class AuditLogComponent implements OnInit {
  entries: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(private svc: AuditService, private auth: AuthService, private router: Router, private cd: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadEntries();
  }

  goBack() {
    this.router.navigate(['/tasks']);
  }

  private async loadEntries() {
    this.loading = true;
    this.error = null;
    try {
      // Ensure user is loaded; redirect to login if not authenticated
      await this.auth.me();
    } catch (e) {
      // not authenticated or failed to fetch user
      console.error('Auth.me failed', e);
      this.loading = false;
      this.router.navigate(['/login']);
      return;
    }

    try {
      const res = await this.svc.list();
      this.entries = res || [];
    } catch (err: any) {
      console.error('Failed to load audit entries', err);
      this.error = err?.error?.message || err?.message || 'Failed to load audit log';
    } finally {
      this.loading = false;
      try { this.cd.detectChanges(); } catch (e) {}
    }
  }
}
