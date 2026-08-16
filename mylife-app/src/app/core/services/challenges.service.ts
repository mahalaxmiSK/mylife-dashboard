import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { DbService } from './db.service';
import { Challenge, ChallengeRule, ChallengeRuleLog } from './models';

@Injectable({ providedIn: 'root' })
export class ChallengesService {
  private db = inject(DbService);

  list(): Observable<Challenge[]> {
    return this.db.all<Challenge>('challenges').pipe(
      map(rows => rows.sort((a, b) =>
        (b.created_at ?? '').localeCompare(a.created_at ?? '')))
    );
  }

  create(payload: Partial<Challenge>): Observable<Challenge> {
    return this.db.insert<Challenge>('challenges', {
      name: payload.name ?? '',
      status: payload.status ?? 'upcoming',
      start_date: payload.start_date ?? null,
      duration_days: payload.duration_days ?? null,
      note: payload.note ?? null
    });
  }

  setStatus(id: string, status: Challenge['status']): Observable<Challenge> {
    return this.db.update<Challenge>('challenges', id, { status });
  }

  /** Rules and their logs go with the challenge, by cascade. */
  remove(id: string): Observable<void> {
    return this.db.remove('challenges', id);
  }

  rules(challengeId: string): Observable<ChallengeRule[]> {
    return this.db.where<ChallengeRule>('challenge_rules', { challenge_id: challengeId }).pipe(
      map(rows => rows.sort((a, b) => a.position - b.position))
    );
  }

  addRule(challengeId: string, text: string, position: number): Observable<ChallengeRule> {
    return this.db.insert<ChallengeRule>('challenge_rules', {
      challenge_id: challengeId,
      text,
      position
    });
  }

  ruleLogs(from: string, to: string): Observable<ChallengeRuleLog[]> {
    return this.db.all<ChallengeRuleLog>('challenge_rule_logs').pipe(
      map(rows => rows.filter(r => r.logged_date >= from && r.logged_date <= to))
    );
  }

  /**
   * One atomic write either way, idempotent by unique constraint.
   *
   * Nothing here ever changes a challenge's status: a missed day is recorded
   * only by the absence of a row, and never ends the challenge (REQ-CHAL-03).
   */
  setRuleLogged(ruleId: string, loggedDate: string, logged: boolean): Observable<void> {
    if (logged) {
      return this.db.upsertUnique(
        'challenge_rule_logs',
        { rule_id: ruleId, logged_date: loggedDate },
        'user_id,rule_id,logged_date'
      );
    }
    return this.db.removeWhere('challenge_rule_logs', { rule_id: ruleId, logged_date: loggedDate });
  }
}
