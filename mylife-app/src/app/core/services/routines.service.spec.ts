import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { RoutinesService } from './routines.service';
import { LocalDbService } from './local-db.service';
import { RoutineItem, RoutineTemplate } from './models';

describe('RoutinesService', () => {
  let service: RoutinesService;
  let db: LocalDbService;

  /** A template with one step, the common starting point for the tick tests. */
  async function seedStep(): Promise<{ template: RoutineTemplate; step: RoutineItem }> {
    const template = await firstValueFrom(service.createTemplate('lazy', 'Slow morning'));
    const step = await firstValueFrom(service.addItem(template.id, 'Make tea', 0));
    return { template, step };
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RoutinesService);
    db = TestBed.inject(LocalDbService);
    await db.clearAll();
  });

  it('reads back a step ticked on a given day', async () => {
    const { step } = await seedStep();

    await firstValueFrom(service.tick(step.id, '2026-08-16'));

    expect(await firstValueFrom(service.tickedOn('2026-08-16'))).toEqual([step.id]);
  });

  it('keeps a tick separate from other days', async () => {
    const { step } = await seedStep();

    await firstValueFrom(service.tick(step.id, '2026-08-16'));

    expect(await firstValueFrom(service.tickedOn('2026-08-17'))).toEqual([]);
  });

  it('forgets a step that is unticked', async () => {
    const { step } = await seedStep();
    await firstValueFrom(service.tick(step.id, '2026-08-16'));

    await firstValueFrom(service.untick(step.id, '2026-08-16'));

    expect(await firstValueFrom(service.tickedOn('2026-08-16'))).toEqual([]);
  });

  it('does not tick the same step twice on one day', async () => {
    const { step } = await seedStep();

    await firstValueFrom(service.tick(step.id, '2026-08-16'));
    await firstValueFrom(service.tick(step.id, '2026-08-16'));

    expect(await firstValueFrom(service.tickedOn('2026-08-16'))).toEqual([step.id]);
  });

  it('discards the ticks of a deleted step', async () => {
    const { step } = await seedStep();
    await firstValueFrom(service.tick(step.id, '2026-08-16'));

    await firstValueFrom(service.removeItem(step.id));

    expect(await firstValueFrom(service.tickedOn('2026-08-16'))).toEqual([]);
  });

  it('discards the ticks of every step in a deleted template', async () => {
    const { template, step } = await seedStep();
    await firstValueFrom(service.tick(step.id, '2026-08-16'));

    await firstValueFrom(service.removeTemplate(template.id));

    expect(await firstValueFrom(service.tickedOn('2026-08-16'))).toEqual([]);
  });
});
