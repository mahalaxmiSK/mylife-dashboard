import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, AuthResponse } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should return authenticated user when logged in', (done) => {
    const mockResponse: AuthResponse = {
      clientPrincipal: {
        userId: 'abc123',
        userDetails: 'user@example.com',
        identityProvider: 'github'
      }
    };

    service.getUser().subscribe(res => {
      expect(res.clientPrincipal?.userDetails).toBe('user@example.com');
      done();
    });

    httpMock.expectOne('/.auth/me').flush(mockResponse);
  });

  it('should return null clientPrincipal when not logged in', (done) => {
    service.getUser().subscribe(res => {
      expect(res.clientPrincipal).toBeNull();
      done();
    });

    httpMock.expectOne('/.auth/me').flush({ clientPrincipal: null });
  });
});
