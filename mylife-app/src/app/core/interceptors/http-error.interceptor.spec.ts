import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../services/toast.service';
import { httpErrorInterceptor } from './http-error.interceptor';

describe('httpErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let toastSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting()
      ]
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    toastSpy = spyOn(TestBed.inject(ToastService), 'show');
  });

  afterEach(() => httpMock.verify());

  it('should call toast.show with generic message on 500', () => {
    http.get('/test').subscribe({ error: () => {} });
    httpMock.expectOne('/test').flush('error', { status: 500, statusText: 'Server Error' });
    expect(toastSpy).toHaveBeenCalledWith('Something went wrong');
  });

  it('should call toast.show with unavailable message on 503', () => {
    http.get('/test').subscribe({ error: () => {} });
    httpMock.expectOne('/test').flush('error', { status: 503, statusText: 'Unavailable' });
    expect(toastSpy).toHaveBeenCalledWith('Service unavailable, try again later');
  });
});
