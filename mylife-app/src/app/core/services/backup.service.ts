import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DbService, TABLES } from './db.service';

interface BackupFile {
  format: string;
  version: number;
  exported_at: string;
  data: Record<string, unknown[]>;
}

const FORMAT = 'mylife-backup';

/**
 * REQ-SYNC-07 / REQ-NFR-04: the user is never locked in and always holds a
 * copy. Now that the data lives on someone else's server, an export that only
 * read this device would be worse than useless — it would look like a backup
 * while containing nothing.
 *
 * There is deliberately no restore-from-file any more. Overwriting a synced
 * account from a stale file is a far more destructive act than replacing one
 * device's local store, and needs conflict rules that do not exist yet. The
 * export stays; putting it back is not offered until that is thought through.
 */
@Injectable({ providedIn: 'root' })
export class BackupService {
  private db = inject(DbService);

  /** Downloads everything the signed-in account can see. */
  async download(): Promise<void> {
    const data: Record<string, unknown[]> = {};
    for (const table of TABLES) {
      data[table] = await firstValueFrom(this.db.all(table));
    }

    const payload: BackupFile = {
      format: FORMAT,
      version: 2,
      exported_at: new Date().toISOString(),
      data
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);

    const link = document.createElement('a');
    link.href = url;
    link.download = `mylife-backup-${date}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }
}
