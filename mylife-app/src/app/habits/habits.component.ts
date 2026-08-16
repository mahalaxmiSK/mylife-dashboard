import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../core/services/toast.service';
import { forkJoin, switchMap } from 'rxjs';
import { HabitsService } from '../core/services/habits.service';
import { StarterContentService } from '../core/services/starter-content.service';
import { Habit, HabitLog, today } from '../core/services/models';

const WINDOW_DAYS = 7;

@Component({
  selector: 'app-habits',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './habits.component.html',
  styleUrl: './habits.component.scss'
})
export class HabitsComponent implements OnInit {
  private service = inject(HabitsService);
  private starter = inject(StarterContentService);
  private toast = inject(ToastService);

  habits: Habit[] = [];
  days: string[] = [];
  draft = '';
  loading = true;

  /** Set of "habitId|date" keys for O(1) lookup when painting the grid. */
  private logged = new Set<string>();

  ngOnInit(): void {
    this.days = this.buildDays();
    this.load();
  }

  private buildDays(): string[] {
    const result: string[] = [];
    const pad = (n: number) => String(n).padStart(2, '0');
    for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      result.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    }
    return result;
  }

  private load(): void {
    this.loading = true;
    this.starter.seedHabits().pipe(
      switchMap(() => forkJoin({
        habits: this.service.list(),
        logs: this.service.allLogs()
      }))
    ).subscribe({
      next: ({ habits, logs }) => {
        this.habits = habits;
        this.logged = new Set(logs.map((l: HabitLog) => `${l.habit_id}|${l.logged_date}`));
        this.loading = false;
      },
      error: () => { this.loading = false; this.toast.show('Could not load your habits'); }
    });
  }

  isLogged(habitId: string, date: string): boolean {
    return this.logged.has(`${habitId}|${date}`);
  }

  toggle(habitId: string, date: string): void {
    const key = `${habitId}|${date}`;
    const wasLogged = this.logged.has(key);

    // Optimistic flip, reverted if the request fails.
    if (wasLogged) this.logged.delete(key); else this.logged.add(key);

    this.service.setLogged(habitId, date, !wasLogged).subscribe({
      error: () => {
        if (wasLogged) this.logged.add(key); else this.logged.delete(key);
        this.toast.show('Could not save that');
      }
    });
  }

  /** REQ-HABIT-01: today leads, so this is the list the page opens on. */
  toggleToday(habit: Habit): void {
    this.toggle(habit.id, today());
  }

  isDoneToday(habit: Habit): boolean {
    return this.isLogged(habit.id, today());
  }

  get doneTodayCount(): number {
    return this.habits.filter(h => this.isDoneToday(h)).length;
  }

  add(): void {
    const name = this.draft.trim();
    if (!name) return;
    this.draft = '';
    this.service.create(name).subscribe({
      next: created => this.habits.push(created),
      error: () => this.toast.show('Could not add that habit')
    });
  }

  remove(habit: Habit): void {
    const index = this.habits.indexOf(habit);
    this.habits.splice(index, 1);
    this.service.remove(habit.id).subscribe({
      error: () => {
        this.habits.splice(index, 0, habit);
        this.toast.show('Could not delete that');
      }
    });
  }

  dayLabel(date: string): string {
    return new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'narrow' });
  }

  /**
   * Consecutive days ending today, counted across all history rather than the
   * visible week. A streak is still alive if today is not yet ticked but
   * yesterday was, so an untouched morning does not read as a broken streak.
   */
  streak(habitId: string): number {
    const pad = (n: number) => String(n).padStart(2, '0');
    const key = (d: Date) =>
      `${habitId}|${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const cursor = new Date();
    if (!this.logged.has(key(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
      if (!this.logged.has(key(cursor))) return 0;
    }

    let count = 0;
    while (this.logged.has(key(cursor))) {
      count++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }

  protected readonly today = today;
}
