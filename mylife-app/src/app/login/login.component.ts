import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  private router = inject(Router);

  passphrase = '';
  busy = false;
  error = '';

  signIn(): void {
    const passphrase = this.passphrase;
    if (!passphrase.trim() || this.busy) return;

    this.busy = true;
    this.error = '';

    this.auth.signIn(passphrase).subscribe({
      // Navigating only after the call resolves means the session is stored
      // before the route guard looks for it, so it cannot race ahead.
      next: () => this.router.navigateByUrl('/'),
      error: err => {
        this.busy = false;
        // Deliberately says nothing about which part was wrong. There is only
        // one account, so "no such user" and "wrong passphrase" are the same
        // fact, and confirming an account exists helps nobody but a guesser.
        this.error = /invalid login credentials/i.test(err?.message ?? '')
          ? 'That is not the passphrase.'
          : 'Could not sign in. Check your connection and try again.';
      }
    });
  }
}
