import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * REQ-SYNC-02: no anonymous access to any data.
 *
 * This is a convenience, not the protection. Anyone can edit their way past a
 * client-side guard; what actually keeps the data private is row-level
 * security in the database (REQ-SYNC-05). This exists so the app shows a login
 * screen instead of a page of empty lists and failed requests.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.currentSession().pipe(
    map(session => (session ? true : router.createUrlTree(['/login'])))
  );
};

/** Keeps a signed-in user off the login screen. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.currentSession().pipe(
    map(session => (session ? router.createUrlTree(['/']) : true))
  );
};
