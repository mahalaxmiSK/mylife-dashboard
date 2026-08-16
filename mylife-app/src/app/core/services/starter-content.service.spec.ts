import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { StarterContentService } from './starter-content.service';
import { LocalDbService } from './local-db.service';
import { RoutinesService } from './routines.service';
import { FeelAliveService } from './feel-alive.service';
import { HabitsService } from './habits.service';
import { TechReadsService } from './tech-reads.service';
import { ChallengesService } from './challenges.service';

describe('StarterContentService', () => {
  let starter: StarterContentService;
  let db: LocalDbService;
  let routines: RoutinesService;
  let feelAlive: FeelAliveService;
  let habits: HabitsService;
  let techReads: TechReadsService;
  let challenges: ChallengesService;

  beforeEach(async () => {
    TestBed.configureTestingModule({});
    starter = TestBed.inject(StarterContentService);
    db = TestBed.inject(LocalDbService);
    routines = TestBed.inject(RoutinesService);
    feelAlive = TestBed.inject(FeelAliveService);
    habits = TestBed.inject(HabitsService);
    techReads = TestBed.inject(TechReadsService);
    challenges = TestBed.inject(ChallengesService);
    await db.clearAll();
  });

  describe('routines', () => {
    it('fills a day type with real steps the first time it is opened', async () => {
      const template = await firstValueFrom(routines.templateFor('lazy'));

      await firstValueFrom(starter.seedRoutine(template));

      const steps = await firstValueFrom(routines.items(template.id));
      expect(steps.length).toBeGreaterThan(3);
      expect(steps[0].text.length).toBeGreaterThan(0);
    });

    it('keeps the steps in the order they were written', async () => {
      const template = await firstValueFrom(routines.templateFor('lazy'));
      await firstValueFrom(starter.seedRoutine(template));

      const steps = await firstValueFrom(routines.items(template.id));

      expect(steps.map(s => s.position)).toEqual(steps.map((_, i) => i));
    });

    it('gives each day type its own steps', async () => {
      const lazy = await firstValueFrom(routines.templateFor('lazy'));
      const focused = await firstValueFrom(routines.templateFor('focused'));
      await firstValueFrom(starter.seedRoutine(lazy));
      await firstValueFrom(starter.seedRoutine(focused));

      const lazySteps = (await firstValueFrom(routines.items(lazy.id))).map(s => s.text);
      const focusedSteps = (await firstValueFrom(routines.items(focused.id))).map(s => s.text);

      expect(lazySteps).not.toEqual(focusedSteps);
    });

    it('does not refill a day the user has emptied', async () => {
      const template = await firstValueFrom(routines.templateFor('lazy'));
      await firstValueFrom(starter.seedRoutine(template));
      for (const step of await firstValueFrom(routines.items(template.id))) {
        await firstValueFrom(routines.removeItem(step.id));
      }

      await firstValueFrom(starter.seedRoutine(template));

      expect(await firstValueFrom(routines.items(template.id))).toEqual([]);
    });
  });

  describe('a module that already has something in it', () => {
    // The upgrade path: someone using the app before seeding existed has data
    // and no mark. Appending a dozen starters to lists she built herself would
    // be an unpleasant surprise.
    it('does not add starters to a list the user has already built', async () => {
      await firstValueFrom(feelAlive.create('Sea swim at dawn'));

      await firstValueFrom(starter.seedFeelAlive());

      const items = await firstValueFrom(feelAlive.list());
      expect(items.map(i => i.text)).toEqual(['Sea swim at dawn']);
    });

    it('does not add starter habits alongside the user\'s own', async () => {
      await firstValueFrom(habits.create('Walk the long way'));

      await firstValueFrom(starter.seedHabits());

      expect((await firstValueFrom(habits.list())).length).toBe(1);
    });

    it('does not add starter steps to a routine that already has some', async () => {
      const template = await firstValueFrom(routines.templateFor('lazy'));
      await firstValueFrom(routines.addItem(template.id, 'My own first step', 0));

      await firstValueFrom(starter.seedRoutine(template));

      const steps = await firstValueFrom(routines.items(template.id));
      expect(steps.map(s => s.text)).toEqual(['My own first step']);
    });

    it('still counts as seeded, so it is not offered again later', async () => {
      await firstValueFrom(feelAlive.create('Sea swim at dawn'));
      await firstValueFrom(starter.seedFeelAlive());

      for (const item of await firstValueFrom(feelAlive.list())) {
        await firstValueFrom(feelAlive.remove(item.id));
      }
      await firstValueFrom(starter.seedFeelAlive());

      expect(await firstValueFrom(feelAlive.list())).toEqual([]);
    });
  });

  describe('the other modules', () => {
    it('offers things to feel alive about, once', async () => {
      await firstValueFrom(starter.seedFeelAlive());
      const first = (await firstValueFrom(feelAlive.list())).length;

      await firstValueFrom(starter.seedFeelAlive());

      expect(first).toBeGreaterThan(5);
      expect((await firstValueFrom(feelAlive.list())).length).toBe(first);
    });

    it('gives every seeded habit the cue that triggers it', async () => {
      await firstValueFrom(starter.seedHabits());

      const seeded = await firstValueFrom(habits.list());

      expect(seeded.length).toBeGreaterThan(5);
      expect(seeded.every(h => !!h.note)).toBe(true);
    });

    it('gives every seeded topic a reason it is worth the time', async () => {
      await firstValueFrom(starter.seedTechReads());

      const seeded = await firstValueFrom(techReads.list());

      expect(seeded.length).toBeGreaterThan(5);
      expect(seeded.every(t => !!t.note)).toBe(true);
    });

    it('leaves every seeded topic unstarted', async () => {
      await firstValueFrom(starter.seedTechReads());

      const seeded = await firstValueFrom(techReads.list());

      expect(seeded.every(t => t.status === 'not_started')).toBe(true);
    });

    it('seeds challenges as upcoming, never already running', async () => {
      // Arriving to six challenges under way would be six commitments
      // nobody made (REQ-SEED-06).
      await firstValueFrom(starter.seedChallenges());

      const seeded = await firstValueFrom(challenges.list());

      expect(seeded.length).toBeGreaterThan(2);
      expect(seeded.every(c => c.status === 'upcoming')).toBe(true);
      expect(seeded.every(c => !c.start_date)).toBe(true);
    });

    it('gives every seeded challenge a length and tickable rules', async () => {
      await firstValueFrom(starter.seedChallenges());

      for (const challenge of await firstValueFrom(challenges.list())) {
        expect(challenge.duration_days).toBeGreaterThan(0);
        const rules = await firstValueFrom(challenges.rules(challenge.id));
        expect(rules.length).toBeGreaterThan(1);
      }
    });
  });
});
