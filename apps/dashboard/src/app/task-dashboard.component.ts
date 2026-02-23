import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task } from './task.model';
import { TaskService } from './task.service';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-task-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './task-dashboard.component.html',
})
export class TaskDashboardComponent implements OnInit {
  tasks: Task[] = [];
  cols: { label: string; status: Task['status']; tasks: Task[] }[] = [];
  categories: string[] = ['Work', 'Personal'];
  filter = '';
  categoryFilter = '';

  newTitle = '';
  newCategory = 'Work';

  editing: Task | null = null;

  constructor(private svc: TaskService, private auth: AuthService, private router: Router) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {
    try {
      this.tasks = (await this.svc.getTasks()) || [];
      this.applyColumns();
    } catch (e) {
      console.error(e);
    }
  }

  applyColumns() {
    const filtered = this.tasks.filter((t) => {
      if (this.filter && !`${t.title} ${t.description}`.toLowerCase().includes(this.filter.toLowerCase())) return false;
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
  }

  async create() {
    if (!this.newTitle) return;
    const created = await this.svc.createTask({ title: this.newTitle, category: this.newCategory });
    this.newTitle = '';
    this.newCategory = 'Work';
    await this.load();
  }

  edit(t: Task) {
    this.editing = { ...t };
  }

  async saveEdit() {
    if (!this.editing) return;
    await this.svc.updateTask(this.editing.id, { title: this.editing.title, description: this.editing.description, category: this.editing.category });
    this.editing = null;
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
      const item = event.previousContainer.data[event.previousIndex];
      // change status and persist
      await this.svc.updateTask(item.id, { status: targetStatus });
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
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
}
