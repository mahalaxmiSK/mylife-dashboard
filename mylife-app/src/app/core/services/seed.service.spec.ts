import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { SeedService } from './seed.service';
import { DbService } from './db.service';
import { InMemoryDbService } from './testing/in-memory-db.service';

describe('SeedService', () => {
  let service: SeedService;
  let db: InMemoryDbService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: DbService, useClass: InMemoryDbService }]
    });
    service = TestBed.inject(SeedService);
    db = TestBed.inject(DbService) as unknown as InMemoryDbService;
    db.clear();
  });

  /** Counts how often the seed body actually runs. */
  function countingSeed(log: string[], name: string): () => Observable<unknown> {
    return () => { log.push(name); return of(undefined); };
  }

  it('runs the seed the first time a module is used', async () => {
    const ran: string[] = [];

    const seeded = await firstValueFrom(
      service.ensureSeeded('routines', countingSeed(ran, 'routines')));

    expect(seeded).toBe(true);
    expect(ran).toEqual(['routines']);
  });

  it('does not run it a second time', async () => {
    const ran: string[] = [];
    await firstValueFrom(service.ensureSeeded('routines', countingSeed(ran, 'routines')));

    const seeded = await firstValueFrom(
      service.ensureSeeded('routines', countingSeed(ran, 'routines')));

    expect(seeded).toBe(false);
    expect(ran).toEqual(['routines']);
  });

  it('leaves a module empty once the user has cleared it', async () => {
    // REQ-SEED-03. Seeding is remembered by the fact that it happened, not by
    // whether anything survives, so deleting the lot does not bring it back.
    const ran: string[] = [];
    await firstValueFrom(service.ensureSeeded('feel-alive', countingSeed(ran, 'first')));

    await firstValueFrom(service.ensureSeeded('feel-alive', countingSeed(ran, 'again')));

    expect(ran).toEqual(['first']);
  });

  it('keeps each module separate', async () => {
    const ran: string[] = [];

    await firstValueFrom(service.ensureSeeded('habits', countingSeed(ran, 'habits')));
    await firstValueFrom(service.ensureSeeded('challenges', countingSeed(ran, 'challenges')));

    expect(ran).toEqual(['habits', 'challenges']);
  });

  it('does not remember a seed that failed', async () => {
    const ran: string[] = [];

    await expectAsync(firstValueFrom(
      service.ensureSeeded('habits', () => throwError(() => new Error('disk full')))
    )).toBeRejected();

    await firstValueFrom(service.ensureSeeded('habits', countingSeed(ran, 'retry')));
    expect(ran).toEqual(['retry']);
  });

  it('survives being asked about a module that was never seeded', async () => {
    expect(await firstValueFrom(service.hasSeeded('nothing-here'))).toBe(false);
  });
});
