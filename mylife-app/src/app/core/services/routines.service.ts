import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { LocalDbService } from './local-db.service';
import { RoutineItem, RoutineItemLog, RoutineTemplate } from './models';

@Injectable({ providedIn: 'root' })
export class RoutinesService {
  private db = inject(LocalDbService);

  templates(): Observable<RoutineTemplate[]> {
    return this.db.all<RoutineTemplate>('routines_templates').pipe(
      map(rows => rows.sort((a, b) =>
        (a.created_at ?? '').localeCompare(b.created_at ?? '')))
    );
  }

  createTemplate(dayType: string, title: string): Observable<RoutineTemplate> {
    return this.db.insert<RoutineTemplate>('routines_templates', {
      day_type: dayType as RoutineTemplate['day_type'],
      title
    });
  }

  items(templateId: string): Observable<RoutineItem[]> {
    return this.db.all<RoutineItem>('routines_items').pipe(
      map(rows => rows
        .filter(r => r.template_id === templateId)
        .sort((a, b) => a.position - b.position))
    );
  }

  addItem(templateId: string, text: string, position: number): Observable<RoutineItem> {
    return this.db.insert<RoutineItem>('routines_items', {
      template_id: templateId,
      text,
      position
    });
  }

  removeItem(id: string): Observable<void> {
    return this.db.removeWhere('routine_item_logs', 'item_id', id).pipe(
      switchMap(() => this.db.remove('routines_items', id))
    );
  }

  /** Removes the template, its steps, and every tick recorded against them. */
  removeTemplate(id: string): Observable<void> {
    return this.items(id).pipe(
      switchMap(items => items.length
        ? forkJoin(items.map(i => this.db.removeWhere('routine_item_logs', 'item_id', i.id)))
        : of([])),
      switchMap(() => this.db.removeWhere('routines_items', 'template_id', id)),
      switchMap(() => this.db.remove('routines_templates', id))
    );
  }

  // ---------- Daily ticks ----------

  /** Ids of the steps ticked on the given local date. */
  tickedOn(date: string): Observable<string[]> {
    return this.db.all<RoutineItemLog>('routine_item_logs').pipe(
      map(rows => rows.filter(r => r.logged_date === date).map(r => r.item_id))
    );
  }

  /**
   * A tick is identified by its step and day rather than a generated id, so
   * tick and untick are each a single atomic write. Toggling quickly cannot
   * interleave a stale read the way a read-modify-write pair would.
   */
  private static logId(itemId: string, date: string): string {
    return `${itemId}:${date}`;
  }

  tick(itemId: string, date: string): Observable<void> {
    return this.db.put<RoutineItemLog>('routine_item_logs', {
      id: RoutinesService.logId(itemId, date),
      item_id: itemId,
      logged_date: date,
      created_at: new Date().toISOString()
    }).pipe(map(() => undefined));
  }

  /** Deleting a key that is not there succeeds, so this is safely repeatable. */
  untick(itemId: string, date: string): Observable<void> {
    return this.db.remove('routine_item_logs', RoutinesService.logId(itemId, date));
  }
}
