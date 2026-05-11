import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

export interface AuthUser {
  userId: string;
  userDetails: string;
  identityProvider: string;
}

export interface AuthResponse {
  clientPrincipal: AuthUser | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  getUser(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>('/.auth/me').pipe(shareReplay(1));
  }
}
