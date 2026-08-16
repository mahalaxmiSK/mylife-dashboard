import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { DbService } from './db.service';
import { FeelAliveItem } from './models';

@Injectable({ providedIn: 'root' })
export class FeelAliveService {
  private db = inject(DbService);

  list(): Observable<FeelAliveItem[]> {
    return this.db.all<FeelAliveItem>('feel_alive_items').pipe(
      map(items => items.sort((a, b) =>
        (b.created_at ?? '').localeCompare(a.created_at ?? '')))
    );
  }

  create(text: string): Observable<FeelAliveItem> {
    return this.db.insert<FeelAliveItem>('feel_alive_items', { text, done: false });
  }

  update(item: FeelAliveItem): Observable<FeelAliveItem> {
    return this.db.update<FeelAliveItem>('feel_alive_items', item.id, {
      text: item.text,
      done: item.done
    });
  }

  remove(id: string): Observable<void> {
    return this.db.remove('feel_alive_items', id);
  }
}
