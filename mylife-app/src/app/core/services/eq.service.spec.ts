import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { EqService } from './eq.service';
import { LocalDbService } from './local-db.service';

describe('EqService', () => {
  let service: EqService;
  let db: LocalDbService;

  beforeEach(async () => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EqService);
    db = TestBed.inject(LocalDbService);
    await db.clearAll();
  });

  describe('suggestions', () => {
    it('offers three for a known emotion', async () => {
      const suggestions = await firstValueFrom(service.suggestionsFor('anxious'));

      expect(suggestions.length).toBe(3);
      expect(suggestions.every(s => s.emotion === 'anxious')).toBe(true);
    });

    it('falls back to general ones for an emotion it does not know', async () => {
      const suggestions = await firstValueFrom(service.suggestionsFor('flummoxed'));

      expect(suggestions.length).toBe(3);
    });
  });

  describe('explore', () => {
    it('asks two or three questions', () => {
      const questions = service.exploreQuestionsFor('anxious');

      expect(questions.length).toBeGreaterThanOrEqual(2);
      expect(questions.length).toBeLessThanOrEqual(3);
    });

    it('asks the same questions throughout one check-in', () => {
      const first = service.exploreQuestionsFor('anxious');
      const second = service.exploreQuestionsFor('anxious');

      expect(second).toEqual(first);
    });

    it('asks a different feeling something different', () => {
      const anxious = service.exploreQuestionsFor('anxious').map(q => q.id);
      const grateful = service.exploreQuestionsFor('grateful').map(q => q.id);

      expect(anxious).not.toEqual(grateful);
    });

    it('never asks the same question twice in one check-in', () => {
      const ids = service.exploreQuestionsFor('overwhelmed').map(q => q.id);

      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('check-ins', () => {
    it('stores an answer against the question that prompted it', async () => {
      const question = service.exploreQuestionsFor('anxious')[0].text;

      const saved = await firstValueFrom(
        service.checkin('anxious', { [question]: 'Since the deploy failed' })
      );

      expect(service.answersOf(saved)).toEqual({ [question]: 'Since the deploy failed' });
    });

    it('keeps the answers after they are read back from storage', async () => {
      const question = service.exploreQuestionsFor('sad')[0].text;
      await firstValueFrom(service.checkin('sad', { [question]: 'A while now' }));

      const [reloaded] = await firstValueFrom(service.checkins());

      expect(service.answersOf(reloaded)).toEqual({ [question]: 'A while now' });
    });

    it('drops answers left blank', async () => {
      const [first, second] = service.exploreQuestionsFor('numb');

      const saved = await firstValueFrom(
        service.checkin('numb', { [first.text]: '   ', [second.text]: 'Since Tuesday' })
      );

      expect(service.answersOf(saved)).toEqual({ [second.text]: 'Since Tuesday' });
    });

    it('accepts an emotion the preset list does not contain', async () => {
      const saved = await firstValueFrom(service.checkin('flummoxed', {}));

      expect(saved.emotion).toBe('flummoxed');
      expect(service.answersOf(saved)).toEqual({});
    });
  });
});
