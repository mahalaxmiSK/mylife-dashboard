import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { SupabaseService } from './supabase.service';

export const TABLES = [
  'routines_templates',
  'routines_items',
  'routine_item_logs',
  'eq_checkins',
  'feel_alive_items',
  'tech_topics',
  'habits',
  'habit_logs',
  'challenges',
  'challenge_rules',
  'challenge_rule_logs',
  'app_meta'
] as const;

export type TableName = (typeof TABLES)[number];

interface Row {
  id: string;
  [key: string]: unknown;
}

/**
 * Thin layer over Supabase, shaped like the IndexedDB service it replaces so
 * the module services above it barely changed.
 *
 * Two things are deliberately absent. Nothing sets user_id: the column
 * defaults to auth.uid() in the database, and row-level security would reject
 * a row claiming to belong to anyone else anyway. And nothing chooses an id:
 * the database assigns them, which is what lets the log tables use a unique
 * constraint for idempotency instead of the derived ids the local version
 * needed.
 */
@Injectable({ providedIn: 'root' })
export class DbService {
  private supabase = inject(SupabaseService).client;

  /** Supabase reports failure in the payload, so turn it into a thrown error. */
  private static unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
    if (result.error) throw new Error(result.error.message);
    return result.data as T;
  }

  all<T extends Row>(table: TableName): Observable<T[]> {
    return from(this.supabase.from(table).select('*')).pipe(
      map(r => DbService.unwrap<T[]>(r as never) ?? [])
    );
  }

  where<T extends Row>(table: TableName, match: Record<string, unknown>): Observable<T[]> {
    return from(this.supabase.from(table).select('*').match(match)).pipe(
      map(r => DbService.unwrap<T[]>(r as never) ?? [])
    );
  }

  insert<T extends Row>(table: TableName, value: Record<string, unknown>): Observable<T> {
    return from(this.supabase.from(table).insert(value).select().single()).pipe(
      map(r => DbService.unwrap<T>(r as never))
    );
  }

  update<T extends Row>(table: TableName, id: string, patch: Partial<T>): Observable<T> {
    // The generated row types are not in play here — the table name is a
    // runtime value — so the patch goes through as a plain object.
    const values = patch as Record<string, unknown>;
    return from(this.supabase.from(table).update(values).eq('id', id).select().single()).pipe(
      map(r => DbService.unwrap<T>(r as never))
    );
  }

  remove(table: TableName, id: string): Observable<void> {
    return from(this.supabase.from(table).delete().eq('id', id)).pipe(
      map(r => { DbService.unwrap(r as never); })
    );
  }

  removeWhere(table: TableName, match: Record<string, unknown>): Observable<void> {
    return from(this.supabase.from(table).delete().match(match)).pipe(
      map(r => { DbService.unwrap(r as never); })
    );
  }

  /**
   * Writes a row that must exist at most once, identified by a unique
   * constraint rather than by an id we made up. Repeating it is a no-op, so
   * two quick taps cannot race into a duplicate or lose one another.
   */
  upsertUnique(
    table: TableName,
    value: Record<string, unknown>,
    onConflict: string
  ): Observable<void> {
    return from(
      this.supabase.from(table).upsert(value, { onConflict, ignoreDuplicates: true })
    ).pipe(map(r => { DbService.unwrap(r as never); }));
  }
}
