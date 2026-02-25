import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  organizationId?: string;
}

const API_BASE =
  (window as any)['__API_BASE__'] ||
  (globalThis as any)?.process?.env?.['API_BASE_URL'] ||
  'http://localhost:3000';
  
@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  currentUser$: Observable<AuthUser | null> = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  async login(email: string, password: string) {
    try {
      // backend sets HttpOnly cookie; we send credentials
      const res = await this.http
        .post<AuthUser>(`${API_BASE}/auth/login`, { email, password }, { withCredentials: true })
        .toPromise();
      // server returns basic user info; set current user observable
      this.currentUserSubject.next(res || null);
      return res;
    } catch (err: any) {
      throw new Error(err?.error?.message || err?.message || 'Login failed');
    }
  }

  async me() {
    try {
      const u = await this.http.get<AuthUser>(`${API_BASE}/auth/me`, { withCredentials: true }).toPromise();
      this.currentUserSubject.next(u || null);
      return u;
    } catch (err) {
      this.currentUserSubject.next(null);
      throw err;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.http.post(`${API_BASE}/auth/logout`, {}, { withCredentials: true }).toPromise();
    } catch (err) {
      // ignore network/server errors but still clear local state
    } finally {
      this.currentUserSubject.next(null);
    }
  }
}
