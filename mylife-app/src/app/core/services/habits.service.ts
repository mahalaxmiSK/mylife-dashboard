import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { DbService } from './db.service';
import { Habit, HabitLog } from './models';

@Injectable({ providedIn: 'root' })
export class HabitsService {
  private db = inject(DbService);

  list(): Observable<Habit[]> {
    return this.db.all<Habit>('habits').pipe(
      map(rows => rows.sort((a, b) =>
        (a.created_at ?? '').localeCompare(b.created_at ?? '')))
    );
  }

  create(name: string, note?: string): Observable<Habit> {
    return this.db.insert<Habit>('habits', note ? { name, note } : { name });
  }

  /** Logs go with the habit: the database cascades on delete. */
  remove(id: string): Observable<void> {
    return this.db.remove('habits', id);
  }

  logs(from: string, to: string): Observable<HabitLog[]> {
    return this.allLogs().pipe(
      map(rows => rows.filter(r => r.logged_date >= from && r.logged_date <= to))
    );
  }

  /** All logs, used for streak counting beyond the visible window. */
  allLogs(): Observable<HabitLog[]> {
    return this.db.all<HabitLog>('habit_logs');
  }

  /**
   * One atomic write either way. Marking is idempotent by unique constraint
   * and clearing tolerates there being nothing to clear, so two quick taps
   * cannot lose one another.
   */
  setLogged(habitId: string, loggedDate: string, logged: boolean): Observable<void> {
    if (logged) {
      return this.db.upsertUnique(
        'habit_logs',
        { habit_id: habitId, logged_date: loggedDate },
        'user_id,habit_id,logged_date'
      );
    }
    return this.db.removeWhere('habit_logs', { habit_id: habitId, logged_date: loggedDate });
  }
}
