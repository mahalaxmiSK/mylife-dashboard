import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should GET from /api/{path}', (done) => {
    service.get<{ id: string }>('health').subscribe(res => {
      expect(res.id).toBe('1');
      done();
    });
    httpMock.expectOne('/api/health').flush({ id: '1' });
  });

  it('should POST to /api/{path} with body', (done) => {
    service.post<{ id: string }>('habits', { name: 'Walk' }).subscribe(res => {
      expect(res.id).toBe('new-id');
      done();
    });
    const req = httpMock.expectOne('/api/habits');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Walk' });
    req.flush({ id: 'new-id' });
  });

  it('should PATCH /api/{path}/{id}', (done) => {
    service.patch<{ status: string }>('habits/123', { done: true }).subscribe(res => {
      expect(res.status).toBe('ok');
      done();
    });
    const req = httpMock.expectOne('/api/habits/123');
    expect(req.request.method).toBe('PATCH');
    req.flush({ status: 'ok' });
  });

  it('should DELETE /api/{path}/{id}', (done) => {
    service.delete('habits/123').subscribe(() => done());
    const req = httpMock.expectOne('/api/habits/123');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
