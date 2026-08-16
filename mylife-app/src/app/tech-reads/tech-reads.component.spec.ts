import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { TechReadsComponent } from './tech-reads.component';
import { TechReadsService } from '../core/services/tech-reads.service';
import { DbService } from '../core/services/db.service';
import { InMemoryDbService } from '../core/services/testing/in-memory-db.service';
import { SeedService } from '../core/services/seed.service';

describe('TechReadsComponent', () => {
  let service: TechReadsService;
  let db: InMemoryDbService;

  async function mount(seed: { title: string; pct: number }[]): Promise<TechReadsComponent> {
    for (const { title, pct } of seed) {
      const created = await firstValueFrom(service.create(title));
      if (pct) await firstValueFrom(service.setProgress(created.id, pct));
    }
    const fixture = TestBed.createComponent(TechReadsComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    for (let i = 0; i < 60 && component.topics.length !== seed.length; i++) {
      await new Promise(r => setTimeout(r, 5));
    }
    fixture.detectChanges();
    return component;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TechReadsComponent],
      providers: [provideRouter([]), { provide: DbService, useClass: InMemoryDbService }]
    }).compileComponents();
    service = TestBed.inject(TechReadsService);
    db = TestBed.inject(DbService) as unknown as InMemoryDbService;
    db.clear();
    // Claim the seed slot with an empty seed, so these tests see only their
    // own fixture rather than the starter topics as well.
    await firstValueFrom(TestBed.inject(SeedService).ensureSeeded('tech-reads', () => of(undefined)));
  });

  describe('picking one at random', () => {
    it('leaves out what is already finished', async () => {
      const component = await mount([
        { title: 'Signals', pct: 0 },
        { title: 'Minimal APIs', pct: 40 },
        { title: 'EF Core', pct: 100 }
      ]);

      expect(component.candidates.map(t => t.title).sort()).toEqual(['Minimal APIs', 'Signals']);
    });

    it('picks one of the unfinished topics', async () => {
      const component = await mount([
        { title: 'Signals', pct: 0 },
        { title: 'EF Core', pct: 100 }
      ]);

      component.pickRandom();

      expect(component.picked!.title).toBe('Signals');
    });

    it('forgets a picked topic once it is deleted', async () => {
      const component = await mount([{ title: 'Signals', pct: 0 }]);
      component.pickRandom();

      component.remove(component.topics[0]);

      expect(component.picked).toBeNull();
    });

    it('picks nothing once everything is finished', async () => {
      const component = await mount([{ title: 'EF Core', pct: 100 }]);

      component.pickRandom();

      expect(component.picked).toBeNull();
    });
  });

  describe('the progress dot', () => {
    it('shows a finished topic at full weight', async () => {
      const component = await mount([{ title: 'EF Core', pct: 100 }]);

      expect(component.dotWeight(component.topics[0])).toBe(1);
    });

    it('keeps an untouched topic faint but visible', async () => {
      const component = await mount([{ title: 'Signals', pct: 0 }]);

      const weight = component.dotWeight(component.topics[0]);
      expect(weight).toBeGreaterThan(0);
      expect(weight).toBeLessThan(0.5);
    });

    it('grows with progress', async () => {
      const component = await mount([
        { title: 'Early', pct: 20 },
        { title: 'Late', pct: 80 }
      ]);
      const early = component.topics.find(t => t.title === 'Early')!;
      const late = component.topics.find(t => t.title === 'Late')!;

      expect(component.dotWeight(late)).toBeGreaterThan(component.dotWeight(early));
    });
  });
});
