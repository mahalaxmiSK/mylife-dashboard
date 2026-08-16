import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../core/services/toast.service';
import { TechReadsService } from '../core/services/tech-reads.service';
import { TechTopic } from '../core/services/models';

@Component({
  selector: 'app-tech-reads',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './tech-reads.component.html',
  styleUrl: './tech-reads.component.scss'
})
export class TechReadsComponent implements OnInit {
  private service = inject(TechReadsService);
  private toast = inject(ToastService);

  topics: TechTopic[] = [];
  draft = '';
  loading = true;
  picked: TechTopic | null = null;

  ngOnInit(): void {
    this.load();
  }

  /**
   * REQ-TECH-01: what a random pick chooses between. A finished topic is not a
   * candidate — the point is to find the next thing to sit down with.
   */
  get candidates(): TechTopic[] {
    return this.topics.filter(t => t.status !== 'done');
  }

  pickRandom(): void {
    const candidates = this.candidates;
    this.picked = candidates.length
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : null;
  }

  /**
   * REQ-TECH-02: how heavy the status dot renders, from progress. Never quite
   * zero, so an untouched topic is still visibly present rather than blank.
   */
  dotWeight(topic: TechTopic): number {
    const pct = Math.min(100, Math.max(0, topic.progress_pct)) / 100;
    return 0.25 + pct * 0.75;
  }

  private load(): void {
    this.loading = true;
    this.service.list().subscribe({
      next: topics => { this.topics = topics; this.loading = false; },
      error: () => { this.loading = false; this.toast.show('Could not load your topics'); }
    });
  }

  add(): void {
    const title = this.draft.trim();
    if (!title) return;
    this.draft = '';
    this.service.create(title).subscribe({
      next: created => this.topics.unshift(created),
      error: () => this.toast.show('Could not save that')
    });
  }

  setProgress(topic: TechTopic, value: string): void {
    const pct = Number(value);
    topic.progress_pct = pct;
    topic.status = pct === 0 ? 'not_started' : pct === 100 ? 'done' : 'in_progress';
    this.service.setProgress(topic.id, pct).subscribe({
      error: () => this.toast.show('Could not save progress')
    });
  }

  remove(topic: TechTopic): void {
    const index = this.topics.indexOf(topic);
    this.topics.splice(index, 1);
    if (this.picked === topic) this.picked = null;
    this.service.remove(topic.id).subscribe({
      error: () => {
        this.topics.splice(index, 0, topic);
        this.toast.show('Could not delete that');
      }
    });
  }

  statusLabel(status: TechTopic['status']): string {
    return status === 'not_started' ? 'Not started'
         : status === 'in_progress' ? 'In progress'
         : 'Done';
  }
}
