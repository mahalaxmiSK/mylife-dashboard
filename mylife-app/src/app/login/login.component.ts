import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private auth = inject(AuthService);

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
   * address is wrong is more use than being told nothing. A real outage shows
   * the same line, which is a fair trade for the common case.
   */
  private static isNotTheOwner(err: unknown): boolean {
    const message = (err as { message?: string })?.message ?? '';
    return /registration is closed|database error saving new user/i.test(message);
  }

  email = '';
  sending = false;
  sent = false;
  error = '';

  send(): void {
    const email = this.email.trim();
    if (!email || this.sending) return;

    this.sending = true;
    this.error = '';

    this.auth.sendMagicLink(email).subscribe({
      next: () => { this.sent = true; this.sending = false; },
      error: err => {
        this.sending = false;
        this.error = LoginComponent.isNotTheOwner(err)
          ? 'This dashboard belongs to one person, and that address is not it.'
          : 'Could not send the link. Check the address and try again.';
      }
    });
  }
}
