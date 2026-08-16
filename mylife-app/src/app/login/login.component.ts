import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

type Step = 'email' | 'code';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  /**
   * The database trigger rejects any address but the owner's, but its own
   * words do not survive the trip. Postgres raises "registration is closed";
   * the auth server turns that into a 500 and the client library rewrites it
   * again, so what actually arrives here is a retryable fetch error saying
   * "Database error saving new user" — which is also, unhelpfully, what a
   * genuine outage would say.
   *
   * Matching on it is therefore a guess, but the right one: a signup that
   * fails inside the database is overwhelmingly this rule, and being told the
   * address is wrong is more use than being told nothing.
   */
  private static isNotTheOwner(err: unknown): boolean {
    const message = (err as { message?: string })?.message ?? '';
    return /registration is closed|database error saving new user/i.test(message);
  }

  step: Step = 'email';
  email = '';
  code = '';
  busy = false;
  error = '';

  send(): void {
    const email = this.email.trim();
    if (!email || this.busy) return;

    this.busy = true;
    this.error = '';

    this.auth.sendCode(email).subscribe({
      next: () => { this.step = 'code'; this.busy = false; },
      error: err => {
        this.busy = false;
        this.error = LoginComponent.isNotTheOwner(err)
          ? 'This dashboard belongs to one person, and that address is not it.'
          : 'Could not send the code. Check the address and try again.';
      }
    });
  }

  verify(): void {
    const code = this.code.trim();
    if (!code || this.busy) return;

    this.busy = true;
    this.error = '';

    this.auth.verifyCode(this.email, code).subscribe({
      // Navigating only after verifyOtp resolves means the session is already
      // stored, so the guard on the way in cannot race ahead of it.
      next: () => this.router.navigateByUrl('/'),
      error: () => {
        this.busy = false;
        this.error = 'That code did not work. It may have expired.';
      }
    });
  }

  startOver(): void {
    this.step = 'email';
    this.code = '';
    this.error = '';
  }
}
