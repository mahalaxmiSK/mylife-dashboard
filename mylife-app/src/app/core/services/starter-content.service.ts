import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of, switchMap } from 'rxjs';
import { SeedService } from './seed.service';
import { RoutinesService } from './routines.service';
import { FeelAliveService } from './feel-alive.service';
import { HabitsService } from './habits.service';
import { TechReadsService } from './tech-reads.service';
import { ChallengesService } from './challenges.service';
import { RoutineTemplate } from './models';
import {
  STARTER_CHALLENGES,
  STARTER_FEEL_ALIVE,
  STARTER_HABITS,
  STARTER_ROUTINES,
  STARTER_TECH_READS
} from './starter-content.data';

/**
 * Puts the bundled starter content into a module the first time it is opened.
 *
 * Everything written here is ordinary user data from that moment on: editable,
 * reorderable and deletable like anything typed by hand (REQ-SEED-02).
 *
 * Two conditions, both required. SeedService gives "never more than once, ever"
 * — it remembers that seeding happened rather than whether anything survived,
 * so a module emptied on purpose stays empty (REQ-SEED-03). The emptiness check
 * below covers the upgrade case: someone who used the app before seeding
 * existed has data and no mark, and appending a dozen starters to lists she
 * built herself would be an unpleasant surprise. Her modules are marked as
 * seeded without anything being written.
 */
@Injectable({ providedIn: 'root' })
export class StarterContentService {
  private gate = inject(SeedService);
  private routines = inject(RoutinesService);
  private feelAlive = inject(FeelAliveService);
  private habits = inject(HabitsService);
  private techReads = inject(TechReadsService);
  private challenges = inject(ChallengesService);

  /** Writes the starters only when `existing` came back empty. */
  private onlyIfEmpty<T>(
    existing: Observable<unknown[]>,
    write: () => Observable<T>
  ): () => Observable<unknown> {
    return () => existing.pipe(
      switchMap(rows => (rows.length ? of([]) : write()))
    );
  }

  /** Each day type is gated separately, because each is opened separately. */
  seedRoutine(template: RoutineTemplate): Observable<boolean> {
    const steps = STARTER_ROUTINES[template.day_type] ?? [];
    return this.gate.ensureSeeded(
      `routines:${template.day_type}`,
      this.onlyIfEmpty(this.routines.items(template.id), () =>
        steps.length
          // Position is passed explicitly, so the writes may land in any order.
          ? forkJoin(steps.map((text, i) => this.routines.addItem(template.id, text, i)))
          : of([]))
    );
  }

  seedFeelAlive(): Observable<boolean> {
    return this.gate.ensureSeeded('feel-alive',
      this.onlyIfEmpty(this.feelAlive.list(), () =>
        forkJoin(STARTER_FEEL_ALIVE.map(text => this.feelAlive.create(text)))));
  }

  seedHabits(): Observable<boolean> {
    return this.gate.ensureSeeded('habits',
      this.onlyIfEmpty(this.habits.list(), () =>
        forkJoin(STARTER_HABITS.map(h => this.habits.create(h.name, h.cue)))));
  }

  seedTechReads(): Observable<boolean> {
    return this.gate.ensureSeeded('tech-reads',
      this.onlyIfEmpty(this.techReads.list(), () =>
        forkJoin(STARTER_TECH_READS.map(t => this.techReads.create(t.title, t.note)))));
  }

  /**
   * Seeded as 'upcoming' with no start date. Arriving to six challenges already
   * running would be six commitments nobody made (REQ-SEED-06).
   */
  seedChallenges(): Observable<boolean> {
    return this.gate.ensureSeeded('challenges',
      this.onlyIfEmpty(this.challenges.list(), () =>
        forkJoin(STARTER_CHALLENGES.map(c =>
          this.challenges.create({
            name: c.name,
            status: 'upcoming',
            duration_days: c.durationDays,
            note: c.note
          }).pipe(
            switchMap(created =>
              forkJoin(c.rules.map((text, i) => this.challenges.addRule(created.id, text, i))))
          )))));
  }
}
