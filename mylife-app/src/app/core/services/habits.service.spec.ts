import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { HabitsService } from './habits.service';
import { DbService } from './db.service';
import { InMemoryDbService } from './testing/in-memory-db.service';
import { Habit, HabitLog } from './models';

describe('HabitsService', () => {
  let service: HabitsService;
  let db: InMemoryDbService;
  let habit: Habit;

  async function loggedDates(habitId: string): Promise<string[]> {
    const logs = await firstValueFrom(service.allLogs());
    return logs.filter(l => l.habit_id === habitId).map(l => l.logged_date).sort();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: DbService, useClass: InMemoryDbService }]
    });
    service = TestBed.inject(HabitsService);
    db = TestBed.inject(DbService) as unknown as InMemoryDbService;
    db.clear();
    habit = await firstValueFrom(service.create('Walk'));
  });

  it('keeps the cue that comes with a habit', async () => {
    // The cue is the habit design: "stretch while the kettle boils" without
    // "the moment you switch the kettle on" is just a wish.
    await firstValueFrom(service.create('Stretch', 'Cue: when you switch the kettle on'));

    const saved = (await firstValueFrom(service.list())).find(h => h.name === 'Stretch')!;

    expect(saved.note).toBe('Cue: when you switch the kettle on');
  });

  it('leaves the note empty for a habit typed by hand', async () => {
    const created = await firstValueFrom(service.create('Walk'));

    expect(created.note).toBeUndefined();
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
