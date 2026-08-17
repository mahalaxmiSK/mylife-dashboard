import { Injectable } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/**
 * The one Supabase client for the app.
 *
 * Sign-in is a numeric code typed into the page, never a link, so the client
 * never has to read a session back out of a URL. That makes both of the usual
 * traps irrelevant:
 *
 * PKCE was the first attempt, chosen because the implicit flow returns the
 * session in the URL fragment and `#access_token=...` collides head-on with
 * this app's `#/routines`. But PKCE ties the code to a verifier held in the
 * browser that requested it, so opening the email in a mail app's in-app
 * browser could never complete — the account was created and confirmed while
 * no session ever reached the browser. With no redirect at all, PKCE buys
 * nothing and costs that.
 *
 * So: implicit, and `detectSessionInUrl` off, because there is no URL to read.
 * The fragment collision cannot happen if nothing ever parses the fragment.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabasePublishableKey,
    {
      auth: {
        flowType: 'implicit',
        // REQ-SYNC-03: the session outlives a browser restart. Logging in
        // daily would kill the habit of using this.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'mylife-auth'
      }
    }
  );
}
