import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { LocalDbService } from './local-db.service';
import { EQ_SUGGESTIONS } from './eq-suggestions.data';
import { EqCheckin, EqSuggestion } from './models';

@Injectable({ providedIn: 'root' })
export class EqService {
  private db = inject(LocalDbService);

  checkins(): Observable<EqCheckin[]> {
    return this.db.all<EqCheckin>('eq_checkins').pipe(
      map(rows => rows
        .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
        .slice(0, 30))
    );
  }

  checkin(emotion: string, notes?: unknown): Observable<EqCheckin> {
    return this.db.insert<EqCheckin>('eq_checkins', { emotion, notes });
  }

  /** Reference data, bundled with the app rather than stored per-device. */
  suggestions(emotion: string): Observable<EqSuggestion[]> {
    return of(EQ_SUGGESTIONS.filter(s => s.emotion === emotion));
  }
}
