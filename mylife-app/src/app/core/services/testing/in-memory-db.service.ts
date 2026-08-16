import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { TableName } from '../db.service';

interface Row {
  id: string;
  [key: string]: unknown;
}

/**
 * Stand-in for DbService in tests.
 *
 * The tests that used to run against a real IndexedDB cannot run against a
 * real Supabase: that would need a live session and would write to the owner's
 * actual data. This replaces only the boundary — every assertion above it is
 * still about what the service under test does, not about this class.
 *
 * It reproduces the two database behaviours the services genuinely rely on:
 * foreign keys cascading on delete, and unique constraints making a repeated
 * write a no-op. Without those the tests would pass against a fiction.
 */
@Injectable()
export class InMemoryDbService {
  private tables = new Map<string, Row[]>();
  private nextId = 1;

  /** Mirrors `on delete cascade` in schema.sql. */
  private static readonly CASCADES: Partial<Record<TableName, [TableName, string][]>> = {
    routines_templates: [['routines_items', 'template_id']],
    routines_items: [['routine_item_logs', 'item_id']],
    habits: [['habit_logs', 'habit_id']],
    challenges: [['challenge_rules', 'challenge_id']],
    challenge_rules: [['challenge_rule_logs', 'rule_id']]
  };

  private rows(table: string): Row[] {
    if (!this.tables.has(table)) this.tables.set(table, []);
    return this.tables.get(table)!;
  }

  private static matches(row: Row, match: Record<string, unknown>): boolean {
    return Object.entries(match).every(([k, v]) => row[k] === v);
  }

  clear(): void {
    this.tables.clear();
    this.nextId = 1;
  }

  all<T extends Row>(table: TableName): Observable<T[]> {
    return of(this.rows(table).map(r => ({ ...r })) as T[]);
  }

  where<T extends Row>(table: TableName, match: Record<string, unknown>): Observable<T[]> {
    return of(this.rows(table).filter(r => InMemoryDbService.matches(r, match))
      .map(r => ({ ...r })) as T[]);
  }

  insert<T extends Row>(table: TableName, value: Record<string, unknown>): Observable<T> {
    const row: Row = {
      ...value,
      id: `row-${this.nextId++}`,
      // Distinct and increasing, so created_at sorts deterministically rather
      // than by whatever a same-millisecond clock happens to return.
      created_at: new Date(1_760_000_000_000 + this.nextId * 1000).toISOString()
    };
    this.rows(table).push(row);
    return of({ ...row } as T);
  }

  update<T extends Row>(table: TableName, id: string, patch: Partial<T>): Observable<T> {
    const rows = this.rows(table);
    const index = rows.findIndex(r => r.id === id);
    if (index < 0) throw new Error(`No row ${id} in ${table}`);
    rows[index] = { ...rows[index], ...patch, id };
    return of({ ...rows[index] } as T);
  }

  remove(table: TableName, id: string): Observable<void> {
    this.deleteRows(table, r => r.id === id);
    return of(undefined);
  }

  removeWhere(table: TableName, match: Record<string, unknown>): Observable<void> {
    this.deleteRows(table, r => InMemoryDbService.matches(r, match));
    return of(undefined);
  }

  /** Deletes, then follows the foreign keys the way the database would. */
  private deleteRows(table: TableName, predicate: (row: Row) => boolean): void {
    const rows = this.rows(table);
    const doomed = rows.filter(predicate);
    if (!doomed.length) return;

    this.tables.set(table, rows.filter(r => !predicate(r)));

    for (const [child, column] of InMemoryDbService.CASCADES[table] ?? []) {
      for (const parent of doomed) {
        this.deleteRows(child, r => r[column] === parent.id);
      }
    }
  }

  /** Mirrors `on conflict do nothing` against the unique constraint. */
  upsertUnique(
    table: TableName,
    value: Record<string, unknown>,
    _onConflict: string
  ): Observable<void> {
    const existing = this.rows(table).some(r => InMemoryDbService.matches(r, value));
    if (!existing) {
      this.rows(table).push({
        ...value,
        id: `row-${this.nextId++}`,
        created_at: new Date().toISOString()
      });
    }
    return of(undefined);
  }
}
