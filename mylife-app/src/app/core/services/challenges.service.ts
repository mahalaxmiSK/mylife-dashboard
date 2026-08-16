import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { LocalDbService } from './local-db.service';
import { Challenge, ChallengeRule, ChallengeRuleLog } from './models';

@Injectable({ providedIn: 'root' })
export class ChallengesService {
  private db = inject(LocalDbService);

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
      start_date: payload.start_date,
      duration_days: payload.duration_days,
      note: payload.note
    } as Omit<Challenge, 'id'>);
  }

  setStatus(id: string, status: Challenge['status']): Observable<Challenge> {
    return this.db.update<Challenge>('challenges', id, { status });
  }

  remove(id: string): Observable<void> {
    // Rule logs hang off rules, so clear those before the rules themselves.
    return this.rules(id).pipe(
      switchMap(async rules => {
        for (const rule of rules) {
          await new Promise<void>(resolve =>
            this.db.removeWhere('challenge_rule_logs', 'rule_id', rule.id)
              .subscribe(() => resolve()));
        }
      }),
      switchMap(() => this.db.removeWhere('challenge_rules', 'challenge_id', id)),
      switchMap(() => this.db.remove('challenges', id))
    );
  }

  rules(challengeId: string): Observable<ChallengeRule[]> {
    return this.db.all<ChallengeRule>('challenge_rules').pipe(
      map(rows => rows
        .filter(r => r.challenge_id === challengeId)
        .sort((a, b) => a.position - b.position))
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
   * Keyed by rule and day so marking is one atomic write. The previous
   * read-then-write pair let two quick taps interleave and lose one.
   *
   * Nothing here ever changes a challenge's status: a missed day is recorded
   * only by the absence of a row, and never ends the challenge (REQ-CHAL-03).
   */
  private static logId(ruleId: string, loggedDate: string): string {
    return `${ruleId}:${loggedDate}`;
  }

  setRuleLogged(ruleId: string, loggedDate: string, logged: boolean): Observable<void> {
    const id = ChallengesService.logId(ruleId, loggedDate);

    if (logged) {
      return this.db.put<ChallengeRuleLog>('challenge_rule_logs', {
        id,
        rule_id: ruleId,
        logged_date: loggedDate,
        created_at: new Date().toISOString()
      }).pipe(map(() => undefined));
    }

    // Rows written before ids were derived still carry a generated one.
    return this.db.remove('challenge_rule_logs', id).pipe(
      switchMap(() => this.db.all<ChallengeRuleLog>('challenge_rule_logs')),
      switchMap(rows => {
        const strays = rows.filter(
          r => r.rule_id === ruleId && r.logged_date === loggedDate);
        if (!strays.length) return of(undefined);
        return forkJoin(strays.map(r => this.db.remove('challenge_rule_logs', r.id)))
          .pipe(map(() => undefined));
      })
    );
  }
}
