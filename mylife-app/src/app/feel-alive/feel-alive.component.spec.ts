import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FeelAliveComponent, nextRotation } from './feel-alive.component';
import { FeelAliveService } from '../core/services/feel-alive.service';
import { LocalDbService } from '../core/services/local-db.service';

describe('FeelAliveComponent', () => {
  let service: FeelAliveService;
  let db: LocalDbService;

  /**
   * Which segment ends up under the pointer, derived independently of the
   * component so the test cannot simply agree with a wrong implementation.
   */
  function segmentUnderPointer(rotation: number, count: number): number {
    const segment = 360 / count;
    const settled = ((360 - (rotation % 360)) % 360);
    return Math.floor(settled / segment);
  }

  async function mount(texts: string[], doneFlags: boolean[] = []): Promise<FeelAliveComponent> {
    for (let i = 0; i < texts.length; i++) {
      const created = await firstValueFrom(service.create(texts[i]));
      if (doneFlags[i]) await firstValueFrom(service.update({ ...created, done: true }));
    }
    const fixture = TestBed.createComponent(FeelAliveComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    for (let i = 0; i < 60 && component.items.length !== texts.length; i++) {
      await new Promise(r => setTimeout(r, 5));
    }
    fixture.detectChanges();
    return component;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeelAliveComponent],
      providers: [provideRouter([])]
    }).compileComponents();
    service = TestBed.inject(FeelAliveService);
    db = TestBed.inject(LocalDbService);
    await db.clearAll();
  });

  it('picks nothing when there is nothing on the list', async () => {
    const component = await mount([]);

    component.spin();

    expect(component.picked).toBeNull();
    expect(component.spinning).toBe(false);
  });

  it('offers only what is not done yet', async () => {
    const component = await mount(['Sea swim', 'Night walk', 'Play piano'], [true, false, false]);

    expect(component.wheelItems.map(i => i.text).sort()).toEqual(['Night walk', 'Play piano']);
  });

  it('falls back to the whole list once everything is done', async () => {
    const component = await mount(['Sea swim', 'Night walk'], [true, true]);

    expect(component.wheelItems.length).toBe(2);
  });

  it('lands the wheel on the item it picked', async () => {
    const component = await mount(['Sea swim', 'Night walk', 'Play piano', 'Bake bread']);
    spyOn(Math, 'random').and.returnValue(0.6);

    component.spin();

    const index = component.wheelItems.indexOf(component.picked!);
    expect(segmentUnderPointer(component.rotation, component.wheelItems.length)).toBe(index);
  });

  describe('nextRotation', () => {
    it('always moves forwards, whatever it lands on', () => {
      let rotation = 0;
      for (const count of [2, 3, 5, 8]) {
        for (let index = 0; index < count; index++) {
          const next = nextRotation(rotation, index, count);
          expect(next).toBeGreaterThan(rotation);
          rotation = next;
        }
      }
    });

    it('comes to rest on the slice it was asked for', () => {
      let rotation = 0;
      for (const count of [2, 3, 5, 8]) {
        for (let index = 0; index < count; index++) {
          rotation = nextRotation(rotation, index, count);
          expect(segmentUnderPointer(rotation, count)).toBe(index);
        }
      }
    });

    it('turns a whole way round rather than nudging, when it lands where it already is', () => {
      const settled = nextRotation(0, 0, 4);

      expect(nextRotation(settled, 0, 4) - settled).toBeGreaterThanOrEqual(360);
    });
  });

  it('keeps an odd number of slices countable at the wrap', async () => {
    const component = await mount(['Sea swim', 'Night walk', 'Play piano']);

    // Alternating tones alone would leave slice 0 and slice 2 identical and
    // touching, so three items would read as two.
    expect(component.wheelGradient).toContain('repeating-conic-gradient');
    expect(component.wheelGradient).toContain('1deg 120deg');
  });

  it('picks without spinning when asked for the plain version', async () => {
    const component = await mount(['Sea swim', 'Night walk']);

    component.pickRandom();

    expect(component.picked).not.toBeNull();
    expect(component.spinning).toBe(false);
  });
});
