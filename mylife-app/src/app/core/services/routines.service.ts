import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import { LocalDbService } from './local-db.service';
import { RoutineItem, RoutineTemplate } from './models';

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
    return this.db.remove('routines_items', id);
  }

  /** Removes the template and its steps. */
  removeTemplate(id: string): Observable<void> {
    return this.db.removeWhere('routines_items', 'template_id', id).pipe(
      switchMap(() => this.db.remove('routines_templates', id))
    );
  }
}
