import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const cloned = req.clone({ withCredentials: true });
    return next.handle(cloned).pipe(
      catchError((err) => {
        if (err && err.status === 401) {
          // clear client-side auth state so UI reacts immediately
          this.auth.logout();
        }
        return throwError(() => err);
      }),
    );
  }
}
