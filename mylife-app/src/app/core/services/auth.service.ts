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
   * Sends the link. `emailRedirectTo` has to be an allowed URI on the project
   * or Supabase refuses, which is why localhost is on that list too.
   */
  sendMagicLink(email: string): Observable<void> {
    return from(
      this.supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: window.location.origin + window.location.pathname }
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
