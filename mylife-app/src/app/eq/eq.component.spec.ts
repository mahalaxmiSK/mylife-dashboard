import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EqComponent } from './eq.component';
import { EqService } from '../core/services/eq.service';
import { DbService } from '../core/services/db.service';
import { InMemoryDbService } from '../core/services/testing/in-memory-db.service';

describe('EqComponent', () => {
  let service: EqService;
  let db: InMemoryDbService;
  let component: EqComponent;

  async function settle(): Promise<void> {
    for (let i = 0; i < 40; i++) await new Promise(r => setTimeout(r, 5));
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EqComponent],
      providers: [provideRouter([]), { provide: DbService, useClass: InMemoryDbService }]
    }).compileComponents();
    service = TestBed.inject(EqService);
    db = TestBed.inject(DbService) as unknown as InMemoryDbService;
    db.clear();

    const fixture = TestBed.createComponent(EqComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;
  });

  it('starts by asking which feeling it is', () => {
    expect(component.step).toBe('name');
  });

  it('moves to explore once a feeling is named', () => {
    component.select('anxious');

    expect(component.step).toBe('explore');
    expect(component.emotion).toBe('anxious');
  });

  it('accepts a feeling that is typed rather than chosen', () => {
    component.customEmotion = '  flummoxed  ';

    component.useCustomEmotion();

    expect(component.emotion).toBe('flummoxed');
    expect(component.step).toBe('explore');
  });

  it('ignores an empty typed feeling', () => {
    component.customEmotion = '   ';

    component.useCustomEmotion();

    expect(component.step).toBe('name');
  });

  it('asks one question at a time', () => {
    component.select('anxious');

    expect(component.currentQuestion).toBe(component.questions[0]);

    component.answer = 'Since this morning';
    component.next();

    expect(component.currentQuestion).toBe(component.questions[1]);
  });

  it('carries each answer back to its own question', async () => {
    component.select('anxious');
    const [first, second] = component.questions;

    component.answer = 'Since this morning';
    component.next();
    component.answer = 'A deadline';
    component.next();
    component.answer = '';
    component.next();
    await settle();

    const [saved] = await firstValueFrom(service.checkins());
    expect(service.answersOf(saved)).toEqual({
      [first.text]: 'Since this morning',
      [second.text]: 'A deadline'
    });
  });

  it('reaches the suggestions once the questions run out', async () => {
    component.select('anxious');
    component.questions.forEach(() => { component.answer = ''; component.next(); });
    await settle();

    expect(component.step).toBe('suggestions');
    expect(component.suggestions.length).toBe(3);
  });

  it('offers suggestions even for a feeling it has never heard of', async () => {
    component.customEmotion = 'flummoxed';
    component.useCustomEmotion();
    component.questions.forEach(() => { component.answer = ''; component.next(); });
    await settle();

    expect(component.suggestions.length).toBe(3);
  });

  it('returns to the start when the check-in is finished', async () => {
    component.select('anxious');
    component.questions.forEach(() => { component.answer = ''; component.next(); });
    await settle();

    component.finish();

    expect(component.step).toBe('name');
    expect(component.emotion).toBeNull();
  });
});
