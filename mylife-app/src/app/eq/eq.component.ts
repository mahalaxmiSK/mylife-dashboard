import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../core/services/toast.service';
import { EqService } from '../core/services/eq.service';
import { EqCheckin, EqSuggestion } from '../core/services/models';

@Component({
  selector: 'app-eq',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './eq.component.html',
  styleUrl: './eq.component.scss'
})
export class EqComponent implements OnInit {
  private service = inject(EqService);
  private toast = inject(ToastService);

  // Must match the emotions seeded in db/seeds/eq_suggestions.sql,
  // otherwise the suggestion lookup returns nothing.
  readonly emotions = [
    'anxious', 'overwhelmed', 'sad', 'angry', 'numb',
    'lonely', 'stuck', 'hopeful', 'grateful', 'excited'
  ];

  selected: string | null = null;
  note = '';
  suggestions: EqSuggestion[] = [];
  history: EqCheckin[] = [];
  saving = false;
  loading = true;

  ngOnInit(): void {
    this.service.checkins().subscribe({
      next: history => { this.history = history; this.loading = false; },
      error: () => { this.loading = false; this.toast.show('Could not load your history'); }
    });
  }

  select(emotion: string): void {
    this.selected = emotion;
    this.suggestions = [];
    this.service.suggestions(emotion).subscribe(s => this.suggestions = s);
  }

  save(): void {
    if (!this.selected || this.saving) return;
    this.saving = true;
    const notes = this.note.trim() ? { text: this.note.trim() } : null;

    this.service.checkin(this.selected, notes).subscribe({
      next: created => {
        this.history.unshift(created);
        this.note = '';
        this.selected = null;
        this.suggestions = [];
        this.saving = false;
      },
      error: () => { this.saving = false; this.toast.show('Could not save that check-in'); }
    });
  }

  noteText(checkin: EqCheckin): string {
    const notes = checkin.notes as { text?: string } | null;
    return notes?.text ?? '';
  }
}
