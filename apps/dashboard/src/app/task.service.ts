import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Task } from './task.model';

const API_BASE = (window as any)['__API_BASE__'] || (globalThis as any)?.process?.env?.['API_BASE_URL'] || 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class TaskService {
  constructor(private http: HttpClient) {}

  getTasks() {
    return this.http.get<Task[]>(`${API_BASE}/tasks`, { withCredentials: true }).toPromise();
  }

  createTask(dto: Partial<Task>) {
    return this.http.post<Task>(`${API_BASE}/tasks`, dto, { withCredentials: true }).toPromise();
  }

  updateTask(id: string, dto: Partial<Task>) {
    return this.http.put<Task>(`${API_BASE}/tasks/${id}`, dto, { withCredentials: true }).toPromise();
  }

  deleteTask(id: string) {
    return this.http.delete(`${API_BASE}/tasks/${id}`, { withCredentials: true }).toPromise();
  }
}
