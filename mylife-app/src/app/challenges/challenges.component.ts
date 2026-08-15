import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../core/services/toast.service';
import { forkJoin } from 'rxjs';
import { ChallengesService } from '../core/services/challenges.service';
import { Challenge, ChallengeRule, ChallengeRuleLog, today } from '../core/services/models';

@Component({
  selector: 'app-challenges',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './challenges.component.html',
  styleUrl: './challenges.component.scss'
})
export class ChallengesComponent implements OnInit {
  private service = inject(ChallengesService);
  private toast = inject(ToastService);

  readonly statuses: Challenge['status'][] =
    ['upcoming', 'active', 'completed', 'abandoned'];

  challenges: Challenge[] = [];
  active: Challenge | null = null;
  rules: ChallengeRule[] = [];

  newName = '';
  newDuration: number | null = 30;
  draftRule = '';
  loading = true;

  private loggedToday = new Set<string>();

  ngOnInit(): void {
    this.service.list().subscribe({
      next: challenges => {
        this.challenges = challenges;
        this.loading = false;
        const current = challenges.find(c => c.status === 'active') ?? challenges[0];
        if (current) this.open(current);
      },
      error: () => { this.loading = false; this.toast.show('Could not load your challenges'); }
    });
  }

  open(challenge: Challenge): void {
    this.active = challenge;
    this.rules = [];
    const date = today();

    forkJoin({
      rules: this.service.rules(challenge.id),
      logs: this.service.ruleLogs(date, date)
    }).subscribe(({ rules, logs }) => {
      this.rules = rules;
      this.loggedToday = new Set(logs.map((l: ChallengeRuleLog) => l.rule_id));
    });
  }

  create(): void {
    const name = this.newName.trim();
    if (!name) return;
    this.newName = '';
    this.service.create({
      name,
      status: 'active',
      start_date: today(),
      duration_days: this.newDuration ?? undefined
    }).subscribe(created => {
      this.challenges.unshift(created);
      this.open(created);
    });
  }

  setStatus(challenge: Challenge, status: string): void {
    const previous = challenge.status;
    challenge.status = status as Challenge['status'];
    this.service.setStatus(challenge.id, challenge.status).subscribe({
      error: () => { challenge.status = previous; this.toast.show('Could not change status'); }
    });
  }

  remove(challenge: Challenge): void {
    const index = this.challenges.indexOf(challenge);
    this.challenges.splice(index, 1);
    if (this.active?.id === challenge.id) {
      this.active = this.challenges[0] ?? null;
      if (this.active) this.open(this.active);
      else this.rules = [];
    }
    this.service.remove(challenge.id).subscribe({
      error: () => {
        this.challenges.splice(index, 0, challenge);
        this.toast.show('Could not delete that');
      }
    });
  }

  addRule(): void {
    const text = this.draftRule.trim();
    if (!text || !this.active) return;
    this.draftRule = '';
    this.service.addRule(this.active.id, text, this.rules.length)
      .subscribe(created => this.rules.push(created));
  }

  isDone(ruleId: string): boolean {
    return this.loggedToday.has(ruleId);
  }

  toggleRule(rule: ChallengeRule): void {
    const wasDone = this.loggedToday.has(rule.id);
    if (wasDone) this.loggedToday.delete(rule.id);
    else this.loggedToday.add(rule.id);

    this.service.toggleRule(rule.id, today()).subscribe({
      error: () => {
        if (wasDone) this.loggedToday.add(rule.id);
        else this.loggedToday.delete(rule.id);
        this.toast.show('Could not save that');
      }
    });
  }

  dayNumber(challenge: Challenge): number | null {
    if (!challenge.start_date) return null;
    const start = new Date(challenge.start_date + 'T00:00:00').getTime();
    const now = new Date(today() + 'T00:00:00').getTime();
    return Math.floor((now - start) / 86_400_000) + 1;
  }
}
