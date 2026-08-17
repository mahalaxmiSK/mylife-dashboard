import { Injectable, inject } from '@angular/core';
import { Observable, from, map, shareReplay, switchMap } from 'rxjs';
import { Session, User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { environment } from '../../../environments/environment';

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
   * Signs in with the typed passphrase. No email is sent, so nothing here can
   * be rate-limited, land in the wrong app, or arrive too late.
   *
   * The passphrase IS the account's Supabase password, not something compared
   * in the browser. That distinction is the whole design: a check in the app
   * could not produce a session, and without a session row-level security
   * returns nothing, on every device. Loosening that to let the public key
   * read the tables would publish the data to anyone who opens devtools.
   *
   * Both previous attempts failed on email delivery — a magic link that could
   * only complete in the browser that requested it, then a code the built-in
   * mailer would only send twice an hour. This has no delivery step at all.
   */
  signIn(passphrase: string): Observable<void> {
    return from(
      this.supabase.auth.signInWithPassword({
        email: environment.ownerEmail,
        password: passphrase
      })
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }

  /**
   * Changes the passphrase from inside the app, so a new one never has to be
   * sent to anyone or typed into a chat window to be set up.
   *
   * Note what this does NOT do: existing sessions on other devices stay valid,
   * because changing a password does not revoke refresh tokens. If the point
   * is to lock someone out, the sessions have to be deleted as well.
   */
  changePassphrase(passphrase: string): Observable<void> {
    return from(this.supabase.auth.updateUser({ password: passphrase })).pipe(
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
