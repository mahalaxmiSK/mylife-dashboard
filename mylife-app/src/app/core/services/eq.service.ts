import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { LocalDbService } from './local-db.service';
import { EQ_SUGGESTIONS } from './eq-suggestions.data';
import { EQ_EXPLORE_QUESTIONS } from './eq-explore.data';
import {
  EqCheckin,
  EqSuggestion,
  ExploreAnswers,
  ExploreQuestion,
  GENERAL_EMOTION
} from './models';

/** REQ-EQ-04: three suggestions, no more. A longer list is another decision to make. */
const SUGGESTION_COUNT = 3;

@Injectable({ providedIn: 'root' })
export class EqService {
  private db = inject(LocalDbService);

  checkins(): Observable<EqCheckin[]> {
    return this.db.all<EqCheckin>('eq_checkins').pipe(
      map(rows => rows
        .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
        .slice(0, 30))
    );
  }

  /** Blank answers are dropped rather than stored as empty strings. */
  checkin(emotion: string, answers: ExploreAnswers = {}): Observable<EqCheckin> {
    const kept: ExploreAnswers = {};
    for (const [question, answer] of Object.entries(answers)) {
      const trimmed = answer?.trim();
      if (trimmed) kept[question] = trimmed;
    }
    return this.db.insert<EqCheckin>('eq_checkins', { emotion, notes: { answers: kept } });
  }

  /**
   * Answers were once stored as a single free-text note. Older check-ins are
   * read back under the question that used to sit above that box.
   */
  answersOf(checkin: EqCheckin): ExploreAnswers {
    const notes = checkin.notes as { answers?: ExploreAnswers; text?: string } | null;
    if (notes?.answers) return notes.answers;
    if (notes?.text) return { 'Anything you want to note': notes.text };
    return {};
  }

  /**
   * The same questions for the whole of one check-in, so answering the first
   * does not change the second (REQ-EQ-02).
   */
  exploreQuestionsFor(_emotion: string): ExploreQuestion[] {
    return EQ_EXPLORE_QUESTIONS;
  }

  /**
   * Reference data, bundled with the app rather than stored per-device. Falls
   * back to the general set so a custom emotion is not a dead end (REQ-EQ-03).
   */
  suggestionsFor(emotion: string): Observable<EqSuggestion[]> {
    const own = EQ_SUGGESTIONS.filter(s => s.emotion === emotion);
    const source = own.length
      ? own
      : EQ_SUGGESTIONS.filter(s => s.emotion === GENERAL_EMOTION);
    return of(source.slice(0, SUGGESTION_COUNT));
  }
}
