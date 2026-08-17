import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ToastService } from '../core/services/toast.service';

/**
 * Lets the owner set their own passphrase from inside the app.
 *
 * This exists so that a secret never has to travel through anyone else to be
 * set up. Whatever it is bootstrapped with is, by definition, known to whoever
 * bootstrapped it; this is how it stops being.
 */
@Component({
  selector: 'app-passphrase',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './passphrase.component.html',
  styleUrl: './passphrase.component.scss'
})
export class PassphraseComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  /**
   * Long enough that guessing is hopeless at the 1,800 attempts an hour the
   * sign-in endpoint allows — a limit that cannot be lowered and comes with no
   * lockout, so length is the only defence there is. Four ordinary words clear
   * this comfortably; a six-digit code cannot.
   */
  static readonly MINIMUM = 16;

  readonly minimum = PassphraseComponent.MINIMUM;

  passphrase = '';
  confirmation = '';
  busy = false;
  error = '';

  get tooShort(): boolean {
    return this.passphrase.length > 0 && this.passphrase.length < this.minimum;
  }

  get mismatch(): boolean {
    return this.confirmation.length > 0 && this.passphrase !== this.confirmation;
  }

  get canSubmit(): boolean {
    return !this.busy
      && this.passphrase.length >= this.minimum
      && this.passphrase === this.confirmation;
  }

  save(): void {
    if (!this.canSubmit) return;
    this.busy = true;
    this.error = '';

    this.auth.changePassphrase(this.passphrase).subscribe({
      next: () => {
        this.busy = false;
        this.toast.show('Passphrase changed. Use it next time you sign in.');
        this.router.navigateByUrl('/');
      },
      error: err => {
        this.busy = false;
        this.error = err?.message
          ? `Could not change it: ${err.message}`
          : 'Could not change it. Try again.';
      }
    });
  }
}
