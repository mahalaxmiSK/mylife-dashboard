import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { RoutinesService } from './routines.service';
import { DbService } from './db.service';
import { InMemoryDbService } from './testing/in-memory-db.service';
import { RoutineItem, RoutineTemplate } from './models';

describe('RoutinesService', () => {
  let service: RoutinesService;
  let db: InMemoryDbService;

  /** A template with one step, the common starting point for the tick tests. */
  async function seedStep(): Promise<{ template: RoutineTemplate; step: RoutineItem }> {
    const template = await firstValueFrom(service.createTemplate('lazy', 'Slow morning'));
    const step = await firstValueFrom(service.addItem(template.id, 'Make tea', 0));
    return { template, step };
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: DbService, useClass: InMemoryDbService }]
    });
    service = TestBed.inject(RoutinesService);
    db = TestBed.inject(DbService) as unknown as InMemoryDbService;
    db.clear();
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

  it('persists a new order for the steps', async () => {
    const template = await firstValueFrom(service.createTemplate('lazy', 'Slow morning'));
    const first = await firstValueFrom(service.addItem(template.id, 'Tea', 0));
    const second = await firstValueFrom(service.addItem(template.id, 'Stretch', 1));

    await firstValueFrom(service.reorder([second, first]));

    const items = await firstValueFrom(service.items(template.id));
    expect(items.map(i => i.text)).toEqual(['Stretch', 'Tea']);
  });

  it('opens the existing template for a day type rather than a second one', async () => {
    const created = await firstValueFrom(service.templateFor('reset'));

    const reopened = await firstValueFrom(service.templateFor('reset'));

    expect(reopened.id).toBe(created.id);
    expect((await firstValueFrom(service.templates())).length).toBe(1);
  });

  it('keeps each day type on its own template', async () => {
    const lazy = await firstValueFrom(service.templateFor('lazy'));
    const focused = await firstValueFrom(service.templateFor('focused'));

    expect(focused.id).not.toBe(lazy.id);
    expect(focused.day_type).toBe('focused');
  });

  it('discards the ticks of every step in a deleted template', async () => {
    const { template, step } = await seedStep();
    await firstValueFrom(service.tick(step.id, '2026-08-16'));

    await firstValueFrom(service.removeTemplate(template.id));

    expect(await firstValueFrom(service.tickedOn('2026-08-16'))).toEqual([]);
  });
});
