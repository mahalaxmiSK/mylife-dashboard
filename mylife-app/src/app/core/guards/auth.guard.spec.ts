import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authService = jasmine.createSpyObj('AuthService', ['getUser']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    });
    guard = TestBed.inject(AuthGuard);
  });

  it('should allow when owner email matches', (done) => {
    authService.getUser.and.returnValue(of({
      clientPrincipal: { userId: '1', userDetails: 'YOUR_EMAIL@example.com', identityProvider: 'github' }
    }));
    guard.canActivate().subscribe(result => {
      expect(result).toBeTrue();
      done();
    });
  });

  it('should redirect to /unauthorized when email does not match', (done) => {
    authService.getUser.and.returnValue(of({
      clientPrincipal: { userId: '2', userDetails: 'stranger@example.com', identityProvider: 'github' }
    }));
    guard.canActivate().subscribe(result => {
      expect(result).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/unauthorized']);
      done();
    });
  });

  it('should return false when not authenticated', (done) => {
    authService.getUser.and.returnValue(of({ clientPrincipal: null }));
    guard.canActivate().subscribe(result => {
      expect(result).toBeFalse();
      done();
    });
  });
});
