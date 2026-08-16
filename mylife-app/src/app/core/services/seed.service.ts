import { Injectable, inject } from '@angular/core';
import { Observable, map, of, switchMap } from 'rxjs';
import { DbService } from './db.service';

interface SeedMark {
  id: string;
  key: string;
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
 * It lives in the database rather than on the device so that signing in on a
 * second device does not look like a fresh install and seed a duplicate set.
 */
@Injectable({ providedIn: 'root' })
export class SeedService {
  private db = inject(DbService);

  hasSeeded(module: string): Observable<boolean> {
    return this.db.where<SeedMark>('app_meta', { key: module }).pipe(
      map(rows => rows.length > 0)
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
          switchMap(() => this.db.upsertUnique('app_meta', { key: module }, 'user_id,key')),
          map(() => true)
        );
      })
    );
  }
}
