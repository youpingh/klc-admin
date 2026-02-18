import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth';
import { map, switchMap } from 'rxjs';

export const AdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.user$.pipe(
    map(user => {
      if (!user) {
        // router.navigate(['/']);
        console.error('No one is logged in.')
        return false;
      }
      return true;
    }),
    switchMap(() => auth.isAdmin$),
    map(isAdmin => {
      if (!isAdmin) {
        // router.navigate(['/']);
        console.error('No permission.')
        return false;
      }
      return true;
    })
  );
};
