import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const API_BASE =
  (window as any)['__API_BASE__'] ||
  (globalThis as any)?.process?.env?.['API_BASE_URL'] ||
  'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class AuditService {
  constructor(private http: HttpClient) {}

  async list() {
    return this.http.get<any[]>(`${API_BASE}/audit-log`, { withCredentials: true }).toPromise();
  }
}
