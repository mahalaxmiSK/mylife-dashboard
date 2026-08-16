import { Injectable, inject } from '@angular/core';
import { Observable, from, map, shareReplay, switchMap } from 'rxjs';
import { Session, User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

/**
 * Magic-link sign-in. No password exists for this account, so there is none to
 * choose, remember, leak, or hand to anybody.
 *
 * Only the owner's address can ever create an account — a trigger on
 * auth.users enforces that in the database (REQ-SYNC-04), so a stranger who
 * types their own email here gets 'registration is closed' rather than a link.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService).client;

  /** Emits on sign-in, sign-out, and token refresh. */
  readonly session$: Observable<Session | null> = new Observable<Session | null>(subscriber => {
    this.supabase.auth.getSession().then(({ data }) => subscriber.next(data.session));
    const { data } = this.supabase.auth.onAuthStateChange((_event, session) => {
      subscriber.next(session);
    });
    return () => data.subscription.unsubscribe();
  }).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  readonly user$: Observable<User | null> = this.session$.pipe(map(s => s?.user ?? null));

  /** Resolves once, with whatever the session is right now. */
  currentSession(): Observable<Session | null> {
    return from(this.supabase.auth.getSession()).pipe(map(({ data }) => data.session));
  }

  /**
   * Emails a six-digit code.
   *
   * Deliberately not a link. A link only works in the browser that asked for
   * it, because the PKCE verifier lives in that browser's storage — open it
   * from a mail app, which has its own in-app browser, and the exchange fails
   * silently and dumps you back on the login screen. That is exactly what
   * happened on the first attempt: the account was created and the address
   * confirmed, but no session ever reached the browser.
   *
   * A code is typed into the page that asked for it, so there is nothing to
   * carry between browsers.
   */
  sendCode(email: string): Observable<void> {
    return from(
      this.supabase.auth.signInWithOtp({ email: email.trim().toLowerCase() })
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }

  /** Exchanges the code for a session. Resolves once the session is stored. */
  verifyCode(email: string, code: string): Observable<void> {
    return from(
      this.supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code.trim(),
        type: 'email'
      })
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }

  /**
   * REQ-SYNC-08: clears the local session and nothing else. Remote data is
   * untouched — signing out is not a delete.
   */
  signOut(): Observable<void> {
    return from(this.supabase.auth.signOut()).pipe(
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }

  /** The signed-in user's id, for writes that set user_id explicitly. */
  requireUserId(): Observable<string> {
    return this.currentSession().pipe(
      switchMap(async session => {
        const id = session?.user?.id;
        if (!id) throw new Error('Not signed in');
        return id;
      })
    );
  }
}
