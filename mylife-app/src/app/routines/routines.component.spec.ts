import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { RoutinesComponent } from './routines.component';
import { RoutinesService } from '../core/services/routines.service';
import { LocalDbService } from '../core/services/local-db.service';
import { SeedService } from '../core/services/seed.service';
import { today } from '../core/services/models';

describe('RoutinesComponent', () => {
  let service: RoutinesService;
  let db: LocalDbService;

  /**
   * Zone stability does not track the chained IndexedDB reads behind a day
   * selection, so poll for the result instead of relying on whenStable().
   */
  async function waitFor(predicate: () => boolean, label: string): Promise<void> {
    for (let i = 0; i < 200; i++) {
      if (predicate()) return;
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    throw new Error(`Timed out waiting for ${label}`);
  }

  /** Mounts the component and opens the seeded lazy day. */
  async function openLazyDay(): Promise<RoutinesComponent> {
    const fixture = TestBed.createComponent(RoutinesComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.selectDay('lazy');
    await waitFor(() => component.items.length > 0, 'the routine steps to load');
    fixture.detectChanges();
    return component;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutinesComponent],
      providers: [provideRouter([])]
    }).compileComponents();
    service = TestBed.inject(RoutinesService);
    db = TestBed.inject(LocalDbService);
    await db.clearAll();
    // Claim the seed slot with an empty seed, so these tests work against the
    // two steps below rather than the starter routine as well.
    await firstValueFrom(
      TestBed.inject(SeedService).ensureSeeded('routines:lazy', () => of(undefined)));

    const template = await firstValueFrom(service.templateFor('lazy'));
    await firstValueFrom(service.addItem(template.id, 'Make tea', 0));
    await firstValueFrom(service.addItem(template.id, 'Stretch', 1));
  });

  it('offers a tile for each of the four day types', async () => {
    const fixture = TestBed.createComponent(RoutinesComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.dayTypes.map(d => d.type))
      .toEqual(['lazy', 'reset', 'creative', 'focused']);
  });

  it('still shows a ticked step after a reload', async () => {
    const first = await openLazyDay();
    first.toggle(first.items[0]);
    await firstValueFrom(service.tickedOn(today()));

    const reloaded = await openLazyDay();

    expect(reloaded.checked.has(reloaded.items[0].id)).toBe(true);
  });

  it('leaves a step unticked after it is toggled off and reloaded', async () => {
    const first = await openLazyDay();
    first.toggle(first.items[0]);
    first.toggle(first.items[0]);

    const reloaded = await openLazyDay();

    expect(reloaded.checked.has(reloaded.items[0].id)).toBe(false);
  });

  it('keeps a moved step in its new place after a reload', async () => {
    const first = await openLazyDay();

    first.move(first.items[0], 1);
    await waitFor(() => first.items[0].text === 'Stretch', 'the step to move');

    const reloaded = await openLazyDay();
    expect(reloaded.items.map(i => i.text)).toEqual(['Stretch', 'Make tea']);
  });

  it('will not move the first step above the top', async () => {
    const component = await openLazyDay();

    component.move(component.items[0], -1);

    expect(component.items.map(i => i.text)).toEqual(['Make tea', 'Stretch']);
  });
});
