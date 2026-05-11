import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, map, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.auth.getUser().pipe(
      map(response => {
        if (!response.clientPrincipal) {
          this.router.navigate(['/unauthorized']);
          return false;
        }
        if (response.clientPrincipal.userDetails !== environment.ownerEmail) {
          this.router.navigate(['/unauthorized']);
          return false;
        }
        return true;
      }),
      catchError(() => {
        this.router.navigate(['/unauthorized']);
        return of(false);
      })
    );
  }
}
