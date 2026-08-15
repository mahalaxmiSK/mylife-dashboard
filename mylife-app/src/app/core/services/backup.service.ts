import { Injectable, inject } from '@angular/core';
import { LocalDbService } from './local-db.service';

interface BackupFile {
  format: string;
  version: number;
  exported_at: string;
  data: Record<string, unknown[]>;
}

const FORMAT = 'mylife-backup';

@Injectable({ providedIn: 'root' })
export class BackupService {
  private db = inject(LocalDbService);

  /** Triggers a download of everything in the local database. */
  async download(): Promise<void> {
    const payload: BackupFile = {
      format: FORMAT,
      version: 1,
      exported_at: new Date().toISOString(),
      data: await this.db.exportAll()
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)],
      { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);

    const link = document.createElement('a');
    link.href = url;
    link.download = `mylife-backup-${date}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }

  /** Replaces all local data with the contents of a backup file. */
  async restore(file: File): Promise<number> {
    let parsed: BackupFile;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      throw new Error('That file is not valid JSON.');
    }

    if (parsed?.format !== FORMAT || !parsed.data) {
      throw new Error('That does not look like a MyLife backup file.');
    }

    await this.db.importAll(parsed.data);
    return Object.values(parsed.data).reduce((sum, rows) => sum + rows.length, 0);
  }
}
