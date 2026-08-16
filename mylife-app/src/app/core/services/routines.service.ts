import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { DbService } from './db.service';
import { DAY_TYPE_TITLES, RoutineItem, RoutineItemLog, RoutineTemplate } from './models';

@Injectable({ providedIn: 'root' })
export class RoutinesService {
  private db = inject(DbService);

  templates(): Observable<RoutineTemplate[]> {
    return this.db.all<RoutineTemplate>('routines_templates').pipe(
      map(rows => rows.sort((a, b) =>
        (a.created_at ?? '').localeCompare(b.created_at ?? '')))
    );
  }

  createTemplate(dayType: string, title: string): Observable<RoutineTemplate> {
    return this.db.insert<RoutineTemplate>('routines_templates', {
      day_type: dayType,
      title
    });
  }

  /**
   * The one template for a day type, created on first use. The four day types
   * are the interface (REQ-ROUT-01), so there is nowhere to put a second
   * template of the same type — and a unique constraint on (user_id, day_type)
   * says so in the database as well.
   */
  templateFor(dayType: RoutineTemplate['day_type']): Observable<RoutineTemplate> {
    return this.templates().pipe(
      switchMap(all => {
        const existing = all.find(t => t.day_type === dayType);
        return existing ? of(existing) : this.createTemplate(dayType, DAY_TYPE_TITLES[dayType]);
      })
    );
  }

  items(templateId: string): Observable<RoutineItem[]> {
    return this.db.where<RoutineItem>('routines_items', { template_id: templateId }).pipe(
      map(rows => rows.sort((a, b) => a.position - b.position))
    );
  }

  addItem(templateId: string, text: string, position: number): Observable<RoutineItem> {
    return this.db.insert<RoutineItem>('routines_items', {
      template_id: templateId,
      text,
      position
    });
  }

  /** Rewrites positions to match the given order. */
  reorder(items: RoutineItem[]): Observable<RoutineItem[]> {
    if (!items.length) return of([]);
    return forkJoin(
      items.map((item, index) =>
        this.db.update<RoutineItem>('routines_items', item.id, { position: index }))
    );
  }

  /** Logs go with the step: the database cascades on delete. */
  removeItem(id: string): Observable<void> {
    return this.db.remove('routines_items', id);
  }

  /** Steps and their logs go with the template, again by cascade. */
  removeTemplate(id: string): Observable<void> {
    return this.db.remove('routines_templates', id);
  }

  // ---------- Daily ticks ----------

  /** Ids of the steps ticked on the given local date. */
  tickedOn(date: string): Observable<string[]> {
    return this.db.where<RoutineItemLog>('routine_item_logs', { logged_date: date }).pipe(
      map(rows => rows.map(r => r.item_id))
    );
  }

  /**
   * Idempotent by unique constraint, so ticking twice is a no-op and two quick
   * taps cannot interleave into a duplicate.
   */
  tick(itemId: string, date: string): Observable<void> {
    return this.db.upsertUnique(
      'routine_item_logs',
      { item_id: itemId, logged_date: date },
      'user_id,item_id,logged_date'
    );
  }

  /** Deleting rows that are not there succeeds, so this is safely repeatable. */
  untick(itemId: string, date: string): Observable<void> {
    return this.db.removeWhere('routine_item_logs', { item_id: itemId, logged_date: date });
  }
}
