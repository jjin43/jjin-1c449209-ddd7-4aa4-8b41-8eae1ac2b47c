import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  try {
    const current = await firstValueFrom(auth.currentUser$);
    if (current) return true;
    return router.createUrlTree(['/login']);
    
  } catch (e) {
    return router.createUrlTree(['/login']);
  }

};
