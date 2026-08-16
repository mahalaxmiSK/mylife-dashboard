import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ChallengesService } from './challenges.service';
import { DbService } from './db.service';
import { InMemoryDbService } from './testing/in-memory-db.service';
import { Challenge, ChallengeRule, ChallengeRuleLog } from './models';

describe('ChallengesService', () => {
  let service: ChallengesService;
  let db: InMemoryDbService;
  let challenge: Challenge;
  let rule: ChallengeRule;

  async function loggedDates(ruleId: string): Promise<string[]> {
    const logs = await firstValueFrom(service.ruleLogs('0000-01-01', '9999-12-31'));
    return logs.filter(l => l.rule_id === ruleId).map(l => l.logged_date).sort();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: DbService, useClass: InMemoryDbService }]
    });
    service = TestBed.inject(ChallengesService);
    db = TestBed.inject(DbService) as unknown as InMemoryDbService;
    db.clear();
    challenge = await firstValueFrom(
      service.create({ name: 'No sugar', status: 'active', start_date: '2026-08-01', duration_days: 30 })
    );
    rule = await firstValueFrom(service.addRule(challenge.id, 'No sweets', 0));
  });

  it('keeps the allowances note that is not a daily rule', async () => {
    // "Miss a night, pick it up the next" is a policy, not something you tick.
    const created = await firstValueFrom(service.create({
      name: 'Seven phone-free nights',
      status: 'upcoming',
      duration_days: 7,
      note: 'Miss a night, pick it up the next'
    }));

    const saved = (await firstValueFrom(service.list())).find(c => c.id === created.id)!;

    expect(saved.note).toBe('Miss a night, pick it up the next');
    expect(saved.duration_days).toBe(7);
  });

  it('records a rule kept on a day', async () => {
    await firstValueFrom(service.setRuleLogged(rule.id, '2026-08-16', true));

    expect(await loggedDates(rule.id)).toEqual(['2026-08-16']);
  });

  it('records it only once however often it is marked', async () => {
    await firstValueFrom(service.setRuleLogged(rule.id, '2026-08-16', true));
    await firstValueFrom(service.setRuleLogged(rule.id, '2026-08-16', true));

    expect(await loggedDates(rule.id)).toEqual(['2026-08-16']);
  });

  it('forgets a rule that is unmarked', async () => {
    await firstValueFrom(service.setRuleLogged(rule.id, '2026-08-16', true));

    await firstValueFrom(service.setRuleLogged(rule.id, '2026-08-16', false));

    expect(await loggedDates(rule.id)).toEqual([]);
  });

  it('unmarks a rule recorded under a generated id', async () => {
    await firstValueFrom(db.insert<ChallengeRuleLog>('challenge_rule_logs', {
      rule_id: rule.id,
      logged_date: '2026-08-16'
    }));

    await firstValueFrom(service.setRuleLogged(rule.id, '2026-08-16', false));

    expect(await loggedDates(rule.id)).toEqual([]);
  });

  it('leaves the challenge running when a day goes unmarked', async () => {
    // REQ-CHAL-03: a missed rule is recorded by its absence and nothing more.
    await firstValueFrom(service.setRuleLogged(rule.id, '2026-08-14', true));

    const [reloaded] = await firstValueFrom(service.list());

    expect(reloaded.status).toBe('active');
  });

  it('discards the rules and logs of a deleted challenge', async () => {
    await firstValueFrom(service.setRuleLogged(rule.id, '2026-08-16', true));

    await firstValueFrom(service.remove(challenge.id));

    expect(await loggedDates(rule.id)).toEqual([]);
    expect(await firstValueFrom(service.rules(challenge.id))).toEqual([]);
  });
});
