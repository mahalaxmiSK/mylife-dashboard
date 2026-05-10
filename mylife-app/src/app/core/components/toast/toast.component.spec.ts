import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastComponent } from './toast.component';
import { ToastService } from '../../services/toast.service';

describe('ToastComponent', () => {
  let fixture: ComponentFixture<ToastComponent>;
  let service: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(ToastComponent);
    service = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('should show message when toast service emits', fakeAsync(() => {
    service.show('hello world');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.toast');
    expect(el).toBeTruthy();
    expect(el.textContent).toContain('hello world');
    tick(3000);
  }));

  it('should hide message after 3 seconds', fakeAsync(() => {
    service.show('fades away');
    fixture.detectChanges();
    tick(3000);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.toast');
    expect(el).toBeNull();
  }));
});
