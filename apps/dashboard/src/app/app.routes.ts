import { Route } from '@angular/router';
import { authGuard } from './auth.guard';

export const appRoutes: Route[] = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./login.component').then((m) => m.LoginComponent) },
  { path: 'tasks', loadComponent: () => import('./task-dashboard.component').then((m) => m.TaskDashboardComponent), canActivate: [authGuard] },
];
