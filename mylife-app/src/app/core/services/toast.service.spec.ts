import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should emit a message when show() is called', (done) => {
    service.messages$.subscribe(msg => {
      expect(msg).toBe('test message');
      done();
    });
    service.show('test message');
  });
});
