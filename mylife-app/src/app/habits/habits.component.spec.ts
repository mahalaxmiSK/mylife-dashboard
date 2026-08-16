import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HabitsComponent } from './habits.component';
import { HabitsService } from '../core/services/habits.service';
import { LocalDbService } from '../core/services/local-db.service';
import { today } from '../core/services/models';

describe('HabitsComponent', () => {
  let service: HabitsService;
  let db: LocalDbService;

  function daysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    const pad = (x: number) => String(x).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  async function mount(names: string[]): Promise<HabitsComponent> {
    for (const name of names) await firstValueFrom(service.create(name));
    const fixture = TestBed.createComponent(HabitsComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    for (let i = 0; i < 60 && component.habits.length !== names.length; i++) {
      await new Promise(r => setTimeout(r, 5));
    }
    fixture.detectChanges();
    return component;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HabitsComponent],
      providers: [provideRouter([])]
    }).compileComponents();
    service = TestBed.inject(HabitsService);
    db = TestBed.inject(LocalDbService);
    await db.clearAll();
  });

  it('marks a habit done for today in one tap', async () => {
    const component = await mount(['Walk']);

    component.toggleToday(component.habits[0]);

    expect(component.isDoneToday(component.habits[0])).toBe(true);
  });

  it('unmarks it on a second tap', async () => {
    const component = await mount(['Walk']);

    component.toggleToday(component.habits[0]);
    component.toggleToday(component.habits[0]);

    expect(component.isDoneToday(component.habits[0])).toBe(false);
  });

  it('counts how many are done today without setting a target', async () => {
    const component = await mount(['Walk', 'Read', 'Stretch']);

    component.toggleToday(component.habits[0]);

    expect(component.doneTodayCount).toBe(1);
  });

  it('keeps a streak alive when today is not ticked but yesterday was', async () => {
    const component = await mount(['Walk']);
    const id = component.habits[0].id;
    await firstValueFrom(service.setLogged(id, daysAgo(1), true));
    await firstValueFrom(service.setLogged(id, daysAgo(2), true));

    const fixture = TestBed.createComponent(HabitsComponent);
    fixture.detectChanges();
    const reloaded = fixture.componentInstance;
    for (let i = 0; i < 60 && reloaded.streak(id) === 0; i++) {
      await new Promise(r => setTimeout(r, 5));
    }

    expect(reloaded.streak(id)).toBe(2);
    expect(reloaded.isDoneToday(reloaded.habits[0])).toBe(false);
  });

  it('counts a streak past the visible week', async () => {
    const component = await mount(['Walk']);
    const id = component.habits[0].id;
    for (let i = 0; i < 10; i++) {
      await firstValueFrom(service.setLogged(id, daysAgo(i), true));
    }

    const fixture = TestBed.createComponent(HabitsComponent);
    fixture.detectChanges();
    const reloaded = fixture.componentInstance;
    for (let i = 0; i < 60 && reloaded.streak(id) < 10; i++) {
      await new Promise(r => setTimeout(r, 5));
    }

    expect(reloaded.streak(id)).toBe(10);
  });

  it('shows today among the days of the week', async () => {
    const component = await mount(['Walk']);

    expect(component.days).toContain(today());
  });
});
