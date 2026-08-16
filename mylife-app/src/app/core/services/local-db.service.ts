import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';

export const STORES = [
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

export type StoreName = (typeof STORES)[number];

const DB_NAME = 'mylife';
// v2 added routine_item_logs, v3 added app_meta. The upgrade handler creates
// whatever is missing, so older databases gain the stores without losing their
// contents.
const DB_VERSION = 3;

interface Row {
  id: string;
  [key: string]: unknown;
}

/**
 * Thin IndexedDB layer. Data lives in this browser only - there is no server,
 * so nothing leaves the device and nothing syncs to another one. Use the
 * backup controls on the home screen to move data between devices.
 */
@Injectable({ providedIn: 'root' })
export class LocalDbService {
  private dbPromise?: Promise<IDBDatabase>;

  private open(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        for (const store of STORES) {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'id' });
          }
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(request.error ?? new Error('Could not open the local database'));
    });

    return this.dbPromise;
  }

  private async run<T>(
    store: StoreName,
    mode: IDBTransactionMode,
    work: (s: IDBObjectStore) => IDBRequest
  ): Promise<T> {
    const db = await this.open();
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction(store, mode);
      const request = work(tx.objectStore(store));
      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () =>
        reject(request.error ?? new Error(`Local database error on ${store}`));
    });
  }

  /** Newly created rows get a client-generated id and timestamp. */
  private static newId(): string {
    return crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  all<T extends Row>(store: StoreName): Observable<T[]> {
    return from(this.run<T[]>(store, 'readonly', s => s.getAll()));
  }

  insert<T extends Row>(store: StoreName, value: Omit<T, 'id'>): Observable<T> {
    const row = {
      ...value,
      id: LocalDbService.newId(),
      created_at: new Date().toISOString()
    } as unknown as T;

    return from(
      this.run(store, 'readwrite', s => s.add(row)).then(() => row)
    );
  }

  /**
   * Writes a row under a caller-chosen id, replacing any row already there.
   * Lets callers derive an id from the data itself, which makes repeat writes
   * idempotent and avoids the read-modify-write race a generated id would need.
   */
  put<T extends Row>(store: StoreName, row: T): Observable<T> {
    return from(this.run(store, 'readwrite', s => s.put(row)).then(() => row));
  }

  update<T extends Row>(store: StoreName, id: string, patch: Partial<T>): Observable<T> {
    const work = async () => {
      const existing = await this.run<T | undefined>(store, 'readonly', s => s.get(id));
      if (!existing) throw new Error('That item no longer exists');
      const merged = { ...existing, ...patch, id } as T;
      await this.run(store, 'readwrite', s => s.put(merged));
      return merged;
    };
    return from(work());
  }

  remove(store: StoreName, id: string): Observable<void> {
    return from(this.run<void>(store, 'readwrite', s => s.delete(id)));
  }

  /** Deletes every row whose field matches, used for cascading deletes. */
  removeWhere(store: StoreName, field: string, value: unknown): Observable<void> {
    const work = async () => {
      const rows = await this.run<Row[]>(store, 'readonly', s => s.getAll());
      const doomed = rows.filter(r => r[field] === value);
      for (const row of doomed) {
        await this.run(store, 'readwrite', s => s.delete(row.id));
      }
    };
    return from(work());
  }

  // ---------- Backup ----------

  /** Every store, as one JSON-serialisable object. */
  async exportAll(): Promise<Record<string, unknown[]>> {
    const dump: Record<string, unknown[]> = {};
    for (const store of STORES) {
      dump[store] = await this.run<unknown[]>(store, 'readonly', s => s.getAll());
    }
    return dump;
  }

  /**
   * Replaces all local data with the contents of a backup. Destructive by
   * design: merging would need conflict rules that do not exist yet, and a
   * half-merged database is harder to reason about than a clean replace.
   */
  async importAll(dump: Record<string, unknown[]>): Promise<void> {
    const known = new Set<string>(STORES);
    const incoming = Object.keys(dump).filter(k => known.has(k));

    if (incoming.length === 0) {
      throw new Error('That file does not look like a MyLife backup.');
    }

    for (const store of STORES) {
      await this.run(store, 'readwrite', s => s.clear());
      for (const row of dump[store] ?? []) {
        if (row && typeof row === 'object' && 'id' in row) {
          await this.run(store, 'readwrite', s => s.put(row));
        }
      }
    }
  }

  async clearAll(): Promise<void> {
    for (const store of STORES) {
      await this.run(store, 'readwrite', s => s.clear());
    }
  }
}
