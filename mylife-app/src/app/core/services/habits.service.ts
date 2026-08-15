import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
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

  toggle(habitId: string, loggedDate: string): Observable<{ logged: boolean }> {
    return this.db.all<HabitLog>('habit_logs').pipe(
      switchMap(rows => {
        const existing = rows.find(
          r => r.habit_id === habitId && r.logged_date === loggedDate);

        if (existing) {
          return this.db.remove('habit_logs', existing.id).pipe(
            map(() => ({ logged: false })));
        }
        return this.db
          .insert<HabitLog>('habit_logs', { habit_id: habitId, logged_date: loggedDate })
          .pipe(map(() => ({ logged: true })));
      })
    );
  }
}
