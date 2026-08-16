import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../core/services/toast.service';
import { EqService } from '../core/services/eq.service';
import { EQ_EMOTIONS } from '../core/services/eq-suggestions.data';
import {
  EqCheckin,
  EqSuggestion,
  ExploreAnswers,
  ExploreQuestion
} from '../core/services/models';

type Step = 'name' | 'explore' | 'suggestions';

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

  /** The preset list is a starting point, not a limit — see useCustomEmotion. */
  readonly emotions = EQ_EMOTIONS;

  step: Step = 'name';
  emotion: string | null = null;
  customEmotion = '';

  questions: ExploreQuestion[] = [];
  questionIndex = 0;
  answer = '';
  private answers: ExploreAnswers = {};

  suggestions: EqSuggestion[] = [];
  history: EqCheckin[] = [];
  saving = false;
  loading = true;

  ngOnInit(): void {
    this.loadHistory();
  }

  private loadHistory(): void {
    this.service.checkins().subscribe({
      next: history => { this.history = history; this.loading = false; },
      error: () => { this.loading = false; this.toast.show('Could not load your history'); }
    });
  }

  // ---------- Step 1: name it ----------

  select(emotion: string): void {
    this.emotion = emotion;
    this.customEmotion = '';
    this.beginExplore();
  }

  /** REQ-EQ-03: the feeling does not have to be one of the ten offered. */
  useCustomEmotion(): void {
    const typed = this.customEmotion.trim();
    if (!typed) return;
    this.emotion = typed.toLowerCase();
    this.customEmotion = '';
    this.beginExplore();
  }

  private beginExplore(): void {
    this.questions = this.service.exploreQuestionsFor(this.emotion!);
    this.questionIndex = 0;
    this.answers = {};
    this.answer = '';
    this.step = 'explore';
  }

  // ---------- Step 2: explore ----------

  get currentQuestion(): ExploreQuestion | null {
    return this.questions[this.questionIndex] ?? null;
  }

  get isLastQuestion(): boolean {
    return this.questionIndex >= this.questions.length - 1;
  }

  /** Answering is optional throughout: a blank answer moves on just the same. */
  next(): void {
    const question = this.currentQuestion;
    if (!question) return;

    if (this.answer.trim()) this.answers[question.text] = this.answer.trim();
    this.answer = '';

    if (this.isLastQuestion) this.save();
    else this.questionIndex += 1;
  }

  back(): void {
    if (this.questionIndex === 0) {
      this.step = 'name';
      this.emotion = null;
      return;
    }
    this.questionIndex -= 1;
    this.answer = this.answers[this.questions[this.questionIndex].text] ?? '';
  }

  // ---------- Step 3: suggestions ----------

  private save(): void {
    if (!this.emotion || this.saving) return;
    this.saving = true;

    this.service.checkin(this.emotion, this.answers).subscribe({
      next: created => {
        this.history.unshift(created);
        this.saving = false;
      },
      error: () => {
        this.saving = false;
        this.toast.show('Could not save that check-in');
      }
    });

    // Suggestions are reference data, so they do not wait on the write.
    this.service.suggestionsFor(this.emotion).subscribe(s => this.suggestions = s);
    this.step = 'suggestions';
  }

  finish(): void {
    this.step = 'name';
    this.emotion = null;
    this.questions = [];
    this.questionIndex = 0;
    this.answers = {};
    this.answer = '';
    this.suggestions = [];
  }

  // ---------- History ----------

  /** A one-line summary of what was written, for the recent list. */
  summaryOf(checkin: EqCheckin): string {
    return Object.values(this.service.answersOf(checkin)).join(' · ');
  }
}
