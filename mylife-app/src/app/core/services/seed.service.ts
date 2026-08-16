import { Injectable, inject } from '@angular/core';
import { Observable, map, of, switchMap } from 'rxjs';
import { LocalDbService } from './local-db.service';

interface SeedMark {
  id: string;
  seeded_at: string;
  [key: string]: unknown;
}

/**
 * Remembers which modules have already been offered their starter content.
 *
 * The mark records that seeding *happened*, not that anything survives. A
 * module the user has since emptied on purpose therefore stays empty
 * (REQ-SEED-03) — checking "is it empty?" instead would quietly refill it
 * every time, which would be maddening.
 *
 * The mark lives in IndexedDB rather than localStorage so it travels with a
 * backup, and later with sync: restoring onto a second device must not look
 * like a fresh install and seed a duplicate set.
 */
@Injectable({ providedIn: 'root' })
export class SeedService {
  private db = inject(LocalDbService);

  private static markId(module: string): string {
    return `seeded:${module}`;
  }

  hasSeeded(module: string): Observable<boolean> {
    return this.db.all<SeedMark>('app_meta').pipe(
      map(rows => rows.some(r => r.id === SeedService.markId(module)))
    );
  }

  /**
   * Runs `seed` once for this module, ever. Resolves to whether it ran.
   * The mark is only written after the seed succeeds, so a failed seed is
   * retried on the next visit rather than leaving the module permanently bare.
   */
  ensureSeeded(module: string, seed: () => Observable<unknown>): Observable<boolean> {
    return this.hasSeeded(module).pipe(
      switchMap(already => {
        if (already) return of(false);
        return seed().pipe(
          switchMap(() => this.db.put<SeedMark>('app_meta', {
            id: SeedService.markId(module),
            seeded_at: new Date().toISOString()
          })),
          map(() => true)
        );
      })
    );
  }
}
