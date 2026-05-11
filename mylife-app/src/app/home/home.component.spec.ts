import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent, RouterTestingModule]
    }).compileComponents();
    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
  });

  it('should render 6 workspace cards', () => {
    const cards = fixture.nativeElement.querySelectorAll('.workspace-card');
    expect(cards.length).toBe(6);
  });

  it('should display greeting', () => {
    const greeting = fixture.nativeElement.querySelector('.greeting');
    expect(greeting.textContent).toContain('✦');
  });

  it('should display today\'s date', () => {
    const date = fixture.nativeElement.querySelector('.date');
    expect(date).toBeTruthy();
  });
});
