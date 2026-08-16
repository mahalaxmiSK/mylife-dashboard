import { Injectable, inject } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
import { LocalDbService } from './local-db.service';
import { DbService } from './db.service';
import { SeedService } from './seed.service';

export interface MigrationReport {
  uploaded: number;
  skipped: number;
  byTable: Record<string, number>;
}

interface LocalRow {
  id: string;
  [key: string]: unknown;
}

/**
 * REQ-SYNC-06: a one-time, user-initiated upload of whatever is already in
 * this browser's IndexedDB.
 *
 * The local database generated its own ids; the server assigns them. So every
 * row is inserted without its old id, and the mapping from old id to new is
 * kept so that the rows pointing at it can be rewritten as we go. Parents have
 * to be uploaded before their children for that to work, which is what the
 * order of PLAN encodes.
 *
 * Nothing is deleted locally. If this goes wrong the original is still sitting
 * in IndexedDB, and the user can export it to a file as well.
 */
@Injectable({ providedIn: 'root' })
export class MigrationService {
  private local = inject(LocalDbService);
  private remote = inject(DbService);
  private seed = inject(SeedService);

  /** Marks the account as migrated so the offer is made only once. */
  static readonly DONE_KEY = 'migrated:indexeddb';

  /**
   * Parents first. `parents` names the columns holding a local id that has to
   * be swapped for the one the server gave that row.
   */
  private static readonly PLAN: {
    store: string;
    table: string;
    parents?: Record<string, string>;
    columns: string[];
  }[] = [
    { store: 'routines_templates', table: 'routines_templates', columns: ['day_type', 'title'] },
    {
      store: 'routines_items', table: 'routines_items',
      parents: { template_id: 'routines_templates' },
      columns: ['template_id', 'text', 'position']
    },
    {
      store: 'routine_item_logs', table: 'routine_item_logs',
      parents: { item_id: 'routines_items' },
      columns: ['item_id', 'logged_date']
    },
    { store: 'eq_checkins', table: 'eq_checkins', columns: ['emotion', 'notes'] },
    { store: 'feel_alive_items', table: 'feel_alive_items', columns: ['text', 'done'] },
    {
      store: 'tech_topics', table: 'tech_topics',
      columns: ['title', 'status', 'progress_pct', 'note']
    },
    { store: 'habits', table: 'habits', columns: ['name', 'note'] },
    {
      store: 'habit_logs', table: 'habit_logs',
      parents: { habit_id: 'habits' },
      columns: ['habit_id', 'logged_date']
    },
    {
      store: 'challenges', table: 'challenges',
      columns: ['name', 'status', 'start_date', 'duration_days', 'note']
    },
    {
      store: 'challenge_rules', table: 'challenge_rules',
      parents: { challenge_id: 'challenges' },
      columns: ['challenge_id', 'text', 'position']
    },
    {
      store: 'challenge_rule_logs', table: 'challenge_rule_logs',
      parents: { rule_id: 'challenge_rules' },
      columns: ['rule_id', 'logged_date']
    }
  ];

  /** True when this browser holds local data that has not been uploaded yet. */
  async hasLocalData(): Promise<boolean> {
    const dump = await this.local.exportAll();
    return Object.entries(dump).some(
      ([store, rows]) => store !== 'app_meta' && rows.length > 0
    );
  }

  async alreadyMigrated(): Promise<boolean> {
    try {
      return await firstValueFrom(this.seed.hasSeeded(MigrationService.DONE_KEY));
    } catch {
      // Not signed in, or the network is down. Either way, do not offer it.
      return false;
    }
  }

  /**
   * Uploads everything, then records that it happened. Safe to abandon and
   * retry: the row is only marked done at the end, and the log tables have
   * unique constraints so a partial rerun cannot double up their rows.
   */
  async run(): Promise<MigrationReport> {
    const dump = await this.local.exportAll();
    const idMap = new Map<string, Map<string, string>>();
    const report: MigrationReport = { uploaded: 0, skipped: 0, byTable: {} };

    for (const step of MigrationService.PLAN) {
      const rows = (dump[step.store] ?? []) as LocalRow[];
      const mapping = new Map<string, string>();
      idMap.set(step.store, mapping);
      if (!rows.length) continue;

      for (const row of rows) {
        const payload: Record<string, unknown> = {};
        let orphaned = false;

        for (const column of step.columns) {
          const parentStore = step.parents?.[column];
          if (parentStore) {
            const newParentId = idMap.get(parentStore)?.get(String(row[column]));
            // A row whose parent never made it has nowhere to hang.
            if (!newParentId) { orphaned = true; break; }
            payload[column] = newParentId;
          } else if (row[column] !== undefined) {
            payload[column] = row[column];
          }
        }

        if (orphaned) { report.skipped++; continue; }

        try {
          const created = await firstValueFrom(
            this.remote.insert<LocalRow>(step.table as never, payload));
          mapping.set(row.id, created.id);
          report.uploaded++;
          report.byTable[step.table] = (report.byTable[step.table] ?? 0) + 1;
        } catch {
          // A duplicate log row is the expected failure on a retry, and is
          // not worth stopping the whole upload for.
          report.skipped++;
        }
      }
    }

    await firstValueFrom(this.seed.ensureSeeded(MigrationService.DONE_KEY, () => of(undefined)));

    return report;
  }
}
