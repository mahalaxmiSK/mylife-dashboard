import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { ChallengesComponent } from './challenges.component';
import { ChallengesService } from '../core/services/challenges.service';
import { DbService } from '../core/services/db.service';
import { InMemoryDbService } from '../core/services/testing/in-memory-db.service';
import { SeedService } from '../core/services/seed.service';
import { Challenge, today } from '../core/services/models';

describe('ChallengesComponent', () => {
  let service: ChallengesService;
  let db: InMemoryDbService;

  function daysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    const pad = (x: number) => String(x).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  async function seed(payloads: Partial<Challenge>[]): Promise<void> {
    for (const p of payloads) await firstValueFrom(service.create(p));
  }

  async function mount(expected: number): Promise<ChallengesComponent> {
    const fixture = TestBed.createComponent(ChallengesComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    for (let i = 0; i < 60 && component.challenges.length !== expected; i++) {
      await new Promise(r => setTimeout(r, 5));
    }
    fixture.detectChanges();
    return component;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChallengesComponent],
      providers: [provideRouter([]), { provide: DbService, useClass: InMemoryDbService }]
    }).compileComponents();
    service = TestBed.inject(ChallengesService);
    db = TestBed.inject(DbService) as unknown as InMemoryDbService;
    db.clear();
    // Claim the seed slot with an empty seed, so these tests see only the
    // fixture they set up rather than the starter challenges as well.
    await firstValueFrom(TestBed.inject(SeedService).ensureSeeded('challenges', () => of(undefined)));
  });

  it('sinks finished challenges below the running ones', async () => {
    await seed([
      { name: 'Done one', status: 'completed' },
      { name: 'Running', status: 'active', start_date: today(), duration_days: 30 },
      { name: 'Gave up', status: 'abandoned' },
      { name: 'Later', status: 'upcoming' }
    ]);

    const component = await mount(4);

    expect(component.liveChallenges.map(c => c.name)).toEqual(['Running', 'Later']);
    expect(component.finishedChallenges.map(c => c.name).sort()).toEqual(['Done one', 'Gave up']);
  });

  it('opens the running challenge without being asked', async () => {
    await seed([
      { name: 'Done one', status: 'completed' },
      { name: 'Running', status: 'active', start_date: today(), duration_days: 30 }
    ]);

    const component = await mount(2);

    expect(component.active?.name).toBe('Running');
  });

  it('counts today as day one on the day it starts', async () => {
    await seed([{ name: 'Running', status: 'active', start_date: today(), duration_days: 30 }]);
    const component = await mount(1);

    expect(component.dayNumber(component.challenges[0])).toBe(1);
  });

  it('counts the days since it started', async () => {
    await seed([{ name: 'Running', status: 'active', start_date: daysAgo(4), duration_days: 30 }]);
    const component = await mount(1);

    expect(component.dayNumber(component.challenges[0])).toBe(5);
  });

  it('leaves a challenge running past its last day', async () => {
    // REQ-CHAL-03: nothing ends a challenge on the user's behalf.
    await seed([{ name: 'Overrun', status: 'active', start_date: daysAgo(40), duration_days: 30 }]);

    const component = await mount(1);

    expect(component.challenges[0].status).toBe('active');
    expect(component.liveChallenges.length).toBe(1);
  });

  it('says nothing about the day when there is no start date', async () => {
    await seed([{ name: 'Someday', status: 'upcoming' }]);
    const component = await mount(1);

    expect(component.dayNumber(component.challenges[0])).toBeNull();
  });
});
