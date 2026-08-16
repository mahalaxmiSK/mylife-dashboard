import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { DbService } from './db.service';
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

/** REQ-EQ-02 asks for two or three questions, not the whole pool. */
const EXPLORE_QUESTION_COUNT = 3;

@Injectable({ providedIn: 'root' })
export class EqService {
  private db = inject(DbService);

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
   * Three questions from the pool of nine (REQ-EQ-02 asks for two or three).
   *
   * Which three is derived from the emotion, so naming a different feeling
   * genuinely asks something different, while one check-in keeps the same
   * three from first question to last — answering one must not change the
   * next. A random pick would break that.
   */
  exploreQuestionsFor(emotion: string): ExploreQuestion[] {
    const pool = EQ_EXPLORE_QUESTIONS;
    const start = EqService.stableIndex(emotion, pool.length);
    return Array.from({ length: EXPLORE_QUESTION_COUNT },
      (_, i) => pool[(start + i) % pool.length]);
  }

  /** Small deterministic string hash; nothing here needs it to be strong. */
  private static stableIndex(value: string, buckets: number): number {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash * 31 + value.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % buckets;
  }

  /**
   * Reference data, bundled with the app rather than stored per user: the
   * suggestions are identical for everyone and need no table (REQ-SEED-07).
   * Falls back to the general set so a custom emotion is not a dead end.
   */
  suggestionsFor(emotion: string): Observable<EqSuggestion[]> {
    const own = EQ_SUGGESTIONS.filter(s => s.emotion === emotion);
    const source = own.length
      ? own
      : EQ_SUGGESTIONS.filter(s => s.emotion === GENERAL_EMOTION);
    return of(source.slice(0, SUGGESTION_COUNT));
  }
}
