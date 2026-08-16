import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { HabitsService } from './habits.service';
import { LocalDbService } from './local-db.service';
import { Habit, HabitLog } from './models';

describe('HabitsService', () => {
  let service: HabitsService;
  let db: LocalDbService;
  let habit: Habit;

  async function loggedDates(habitId: string): Promise<string[]> {
    const logs = await firstValueFrom(service.allLogs());
    return logs.filter(l => l.habit_id === habitId).map(l => l.logged_date).sort();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HabitsService);
    db = TestBed.inject(LocalDbService);
    await db.clearAll();
    habit = await firstValueFrom(service.create('Walk'));
  });

  it('records a day and reads it back', async () => {
    await firstValueFrom(service.setLogged(habit.id, '2026-08-16', true));

    expect(await loggedDates(habit.id)).toEqual(['2026-08-16']);
  });

  it('records a day only once however often it is marked', async () => {
    await firstValueFrom(service.setLogged(habit.id, '2026-08-16', true));
    await firstValueFrom(service.setLogged(habit.id, '2026-08-16', true));

    expect(await loggedDates(habit.id)).toEqual(['2026-08-16']);
  });

  it('forgets a day that is unmarked', async () => {
    await firstValueFrom(service.setLogged(habit.id, '2026-08-16', true));

    await firstValueFrom(service.setLogged(habit.id, '2026-08-16', false));

    expect(await loggedDates(habit.id)).toEqual([]);
  });

  it('unmarking a day it never had is harmless', async () => {
    await firstValueFrom(service.setLogged(habit.id, '2026-08-16', false));

    expect(await loggedDates(habit.id)).toEqual([]);
  });

  it('keeps days apart', async () => {
    await firstValueFrom(service.setLogged(habit.id, '2026-08-16', true));
    await firstValueFrom(service.setLogged(habit.id, '2026-08-17', true));

    await firstValueFrom(service.setLogged(habit.id, '2026-08-16', false));

    expect(await loggedDates(habit.id)).toEqual(['2026-08-17']);
  });

  it('unmarks a day that was recorded under a generated id', async () => {
    // How rows were written before the id was derived from habit and date.
    await firstValueFrom(db.insert<HabitLog>('habit_logs', {
      habit_id: habit.id,
      logged_date: '2026-08-16'
    }));

    await firstValueFrom(service.setLogged(habit.id, '2026-08-16', false));

    expect(await loggedDates(habit.id)).toEqual([]);
  });

  it('discards the logs of a deleted habit', async () => {
    await firstValueFrom(service.setLogged(habit.id, '2026-08-16', true));

    await firstValueFrom(service.remove(habit.id));

    expect(await loggedDates(habit.id)).toEqual([]);
  });
});
