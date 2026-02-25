import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task } from '../../models/task.model';
import { TaskService } from '../../services/task.service';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';


@Component({
  selector: 'app-task-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './task-dashboard.component.html',
})
export class TaskDashboardComponent implements OnInit {
  tasks: Task[] = [];
  currentUser: any = null;
  cols: { label: string; status: Task['status']; tasks: Task[] }[] = [];
  connectedIds: string[] = [];
  categories: string[] = ['Work', 'Personal'];
  filter = '';
  categoryFilter = '';

  // Pie chart data
  pieSlices: Array<{ d?: string; isCircle?: boolean; color: string; label: string; value: number }> = [];

  newTitle = '';
  newCategory = 'Work';
  showCreate = false;
  newPermEmails = '';
  newPermCanEdit = true;
  newPermCanDelete = false;

  editing: Task | null = null;
  editingPermEmails = '';
  editingPermCanEdit = true;
  editingPermCanDelete = false;

  constructor(private svc: TaskService, private auth: AuthService, private router: Router, private cd: ChangeDetectorRef) {}

  async ngOnInit() {
    // ensure current user is loaded so role-based UI (Audit button) can render
    try {
      await this.auth.me();
    } catch (e) {
      // ignore; user may not be authenticated and will be redirected when needed
    }
    this.auth.currentUser$.subscribe((u) => (this.currentUser = u));
    await this.load();
  }

  async load() {
    try {
      this.tasks = (await this.svc.getTasks()) || [];
      this.applyColumns();
      this.updatePie();
      // ensure view updates after async load
      try { this.cd.detectChanges(); } catch (e) {}
    } catch (e) {
      console.error(e);
    }
  }

  applyColumns() {
    const filtered = this.tasks.filter((t) => {
      if (this.filter && !(String(t.title || '').toLowerCase().includes(this.filter.toLowerCase()))) return false;
      if (this.categoryFilter && t.category !== this.categoryFilter) return false;
      return true;
    });
    const todo = filtered.filter((t) => t.status === 'TODO');
    const inprog = filtered.filter((t) => t.status === 'IN_PROGRESS');
    const done = filtered.filter((t) => t.status === 'DONE');
    this.cols = [
      { label: 'To Do', status: 'TODO', tasks: todo },
      { label: 'In Progress', status: 'IN_PROGRESS', tasks: inprog },
      { label: 'Done', status: 'DONE', tasks: done },
    ];
    // update connected drop list ids for CDK
    this.connectedIds = this.cols.map(c => c.status);
    // update pie when view/filter changes
    this.updatePie();
  }

  updatePie() {
    const counts = { TODO: 0, IN_PROGRESS: 0, DONE: 0 } as any;
    for (const t of this.tasks) {
      counts[t.status] = (counts[t.status] || 0) + 1;
    }
    const total = counts.TODO + counts.IN_PROGRESS + counts.DONE;
    if (total === 0) {
      this.pieSlices = [];
      return;
    }

    // helper: describe arc path for a pie slice
    const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
      const start = polarToCartesian(cx, cy, r, endAngle);
      const end = polarToCartesian(cx, cy, r, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
      return [`M ${cx} ${cy}`, `L ${start.x} ${start.y}`, `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`, 'Z'].join(' ');
    };

    const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
      const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
      return { x: cx + (r * Math.cos(angleInRadians)), y: cy + (r * Math.sin(angleInRadians)) };
    };

    const colors = { TODO: '#ef4444', IN_PROGRESS: '#f59e0b', DONE: '#10b981' };
    const labels = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };

    const slices: Array<{ d?: string; isCircle?: boolean; color: string; label: string; value: number }> = [];
    let startA = 0;
    for (const key of ['TODO', 'IN_PROGRESS', 'DONE']) {
      const v = counts[key];
      if (!v) {
        startA += 0;
        continue;
      }
      const angle = (v / total) * 360;
      const endA = startA + angle;
      if (Math.abs(angle - 360) < 0.0001) {
        // full circle: render a circle element instead of an arc path
        slices.push({ isCircle: true, color: (colors as any)[key], label: (labels as any)[key], value: v });
      } else {
        const d = describeArc(50, 50, 40, startA, endA);
        slices.push({ d, color: (colors as any)[key], label: (labels as any)[key], value: v });
      }
      startA = endA;
    }

    this.pieSlices = slices;
  }

  async create() {
    if (!this.newTitle) return;
    const current = await firstValueFrom(this.auth.currentUser$);
    const role = current?.role;
    const perms: any[] = [];
    if (this.newPermEmails && this.newPermEmails.trim()) {
      const emails = this.newPermEmails.split(/[;,\s]+/).map(s => s.trim()).filter(Boolean);
      for (const e of emails) perms.push({ email: e, canEdit: !!this.newPermCanEdit, canDelete: !!this.newPermCanDelete });
    }
    const payload: any = { title: this.newTitle, category: this.newCategory, role };
    if (perms.length) payload.permissions = perms;
    const created = await this.svc.createTask(payload)
    this.newTitle = '';
    this.newCategory = 'Work';
    this.newPermEmails = '';
    this.newPermCanEdit = true;
    this.newPermCanDelete = false;
    this.showCreate = false;
    await this.load();
  }

  openCreate() {
    this.showCreate = true;
  }

  closeCreate() {
    this.showCreate = false;
    this.newTitle = '';
    this.newCategory = 'Work';
  }

  edit(t: Task) {
    this.editing = { ...t };
    this.editingPermEmails = '';
    this.editingPermCanEdit = true;
    this.editingPermCanDelete = false;
  }

  async saveEdit() {
    if (!this.editing) return;
    const dto: any = { title: this.editing.title, category: this.editing.category };
    const perms: any[] = [];
    if (this.editingPermEmails && this.editingPermEmails.trim()) {
      const emails = this.editingPermEmails.split(/[;,\s]+/).map(s => s.trim()).filter(Boolean);
      for (const e of emails) perms.push({ email: e, canEdit: !!this.editingPermCanEdit, canDelete: !!this.editingPermCanDelete });
      dto.permissions = perms;
    }
    await this.svc.updateTask(this.editing.id, dto);
    this.editing = null;
    this.editingPermEmails = '';
    this.editingPermCanEdit = true;
    this.editingPermCanDelete = false;
    await this.load();
  }

  cancelEdit() {
    this.editing = null;
  }

  async remove(t: Task) {
    if (!confirm('Delete task?')) return;
    await this.svc.deleteTask(t.id);
    await this.load();
  }

async drop(event: CdkDragDrop<Task[]>, targetStatus: Task['status']) {
  if (event.previousContainer === event.container) {
    moveItemInArray(event.container.data, event.currentIndex, event.previousIndex);
    // Optionally update ordering on server if supported
  } else {
    const prevData = event.previousContainer.data as Task[];
    const currData = event.container.data as Task[];
    const item = prevData[event.previousIndex];
    if (!item) return;

    // Optimistic update: set status locally and move immediately
    const oldStatus = item.status;
    try {
      item.status = targetStatus;
      transferArrayItem(prevData, currData, event.previousIndex, event.currentIndex);

      // Persist change
      await this.svc.updateTask(item.id, { status: targetStatus });
    } catch (err) {
      // Revert on failure
      try {
        transferArrayItem(currData, prevData, event.currentIndex, event.previousIndex);
        item.status = oldStatus;
      } catch (e) {}
      console.error('Failed to update task status', err);
    }

    // Re-sync with server canonical state
    await this.load();
  }
}

  async doLogout() {
    try {
      await this.auth.logout();
    } catch (e) {
      // ignore
    }
    this.router.navigate(['/login']);
  }

  goAudit() {
    this.router.navigate(['/audit-log']);
  }
}
