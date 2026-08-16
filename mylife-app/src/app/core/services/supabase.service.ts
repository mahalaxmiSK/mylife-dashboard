import { Injectable } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/**
 * The one Supabase client for the app.
 *
 * PKCE rather than the default implicit flow, because this app uses hash
 * routing. The implicit flow returns the session in the URL fragment
 * (`#access_token=...`), which collides head-on with the router's `#/routines`
 * — the router would eat the fragment, or the parse would eat the route. PKCE
 * returns `?code=...` in the query string instead, which nothing else wants.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabasePublishableKey,
    {
      auth: {
        flowType: 'pkce',
        // REQ-SYNC-03: the session outlives a browser restart. Logging in
        // daily would kill the habit of using this.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'mylife-auth'
      }
    }
  );
}
