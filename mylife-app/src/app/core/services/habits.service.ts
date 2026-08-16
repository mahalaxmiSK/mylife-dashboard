import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { LocalDbService } from './local-db.service';
import { Habit, HabitLog } from './models';

@Injectable({ providedIn: 'root' })
export class HabitsService {
  private db = inject(LocalDbService);

  list(): Observable<Habit[]> {
    return this.db.all<Habit>('habits').pipe(
      map(rows => rows.sort((a, b) =>
        (a.created_at ?? '').localeCompare(b.created_at ?? '')))
    );
  }

  create(name: string): Observable<Habit> {
    return this.db.insert<Habit>('habits', { name });
  }

  remove(id: string): Observable<void> {
    return this.db.removeWhere('habit_logs', 'habit_id', id).pipe(
      switchMap(() => this.db.remove('habits', id))
    );
  }

  logs(from: string, to: string): Observable<HabitLog[]> {
    return this.db.all<HabitLog>('habit_logs').pipe(
      map(rows => rows.filter(r => r.logged_date >= from && r.logged_date <= to))
    );
  }

  /** All logs, used for streak counting beyond the visible window. */
  allLogs(): Observable<HabitLog[]> {
    return this.db.all<HabitLog>('habit_logs');
  }

  /**
   * A log is identified by its habit and day rather than a generated id, so
   * marking a day is one atomic write. The previous read-then-write pair let
   * two quick taps interleave: both reads saw no row, and one tap was lost.
   */
  private static logId(habitId: string, loggedDate: string): string {
    return `${habitId}:${loggedDate}`;
  }

  setLogged(habitId: string, loggedDate: string, logged: boolean): Observable<void> {
    const id = HabitsService.logId(habitId, loggedDate);

    if (logged) {
      return this.db.put<HabitLog>('habit_logs', {
        id,
        habit_id: habitId,
        logged_date: loggedDate,
        created_at: new Date().toISOString()
      }).pipe(map(() => undefined));
    }

    // Rows written before ids were derived still carry a generated one, so
    // clearing a day has to sweep by field as well as by key.
    return this.db.remove('habit_logs', id).pipe(
      switchMap(() => this.db.all<HabitLog>('habit_logs')),
      switchMap(rows => {
        const strays = rows.filter(
          r => r.habit_id === habitId && r.logged_date === loggedDate);
        if (!strays.length) return of(undefined);
        return forkJoin(strays.map(r => this.db.remove('habit_logs', r.id)))
          .pipe(map(() => undefined));
      })
    );
  }
}
