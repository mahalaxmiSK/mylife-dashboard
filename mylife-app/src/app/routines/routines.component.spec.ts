import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { RoutinesComponent } from './routines.component';
import { RoutinesService } from '../core/services/routines.service';
import { LocalDbService } from '../core/services/local-db.service';
import { today } from '../core/services/models';

describe('RoutinesComponent', () => {
  let service: RoutinesService;
  let db: LocalDbService;

  /**
   * Zone stability does not track the chained IndexedDB reads behind ngOnInit,
   * so poll for the result instead of relying on whenStable().
   */
  async function waitFor(predicate: () => boolean, label: string): Promise<void> {
    for (let i = 0; i < 200; i++) {
      if (predicate()) return;
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    throw new Error(`Timed out waiting for ${label}`);
  }

  /** Mounts the component and waits until its first template has opened. */
  async function mount(): Promise<RoutinesComponent> {
    const fixture = TestBed.createComponent(RoutinesComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
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

    const template = await firstValueFrom(service.createTemplate('lazy', 'Slow morning'));
    await firstValueFrom(service.addItem(template.id, 'Make tea', 0));
  });

  it('still shows a ticked step after a reload', async () => {
    const first = await mount();
    first.toggle(first.items[0]);
    await firstValueFrom(service.tickedOn(today()));

    const reloaded = await mount();

    expect(reloaded.checked.has(reloaded.items[0].id)).toBe(true);
  });

  it('leaves a step unticked after it is toggled off and reloaded', async () => {
    const first = await mount();
    first.toggle(first.items[0]);
    first.toggle(first.items[0]);

    const reloaded = await mount();

    expect(reloaded.checked.has(reloaded.items[0].id)).toBe(false);
  });
});
