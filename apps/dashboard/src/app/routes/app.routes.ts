import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  { path: '', redirectTo: 'tasks', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('../components/login/login.component').then((m) => m.LoginComponent) },
  { path: 'tasks', loadComponent: () => import('../components/task-dashboard/task-dashboard.component').then((m) => m.TaskDashboardComponent) },
  { path: 'audit-log', loadComponent: () => import('../components/audit-log/audit-log.component').then((m) => m.AuditLogComponent) },
];
