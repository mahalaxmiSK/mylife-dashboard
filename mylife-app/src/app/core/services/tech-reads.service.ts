import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { LocalDbService } from './local-db.service';
import { TechTopic } from './models';

@Injectable({ providedIn: 'root' })
export class TechReadsService {
  private db = inject(LocalDbService);

  list(): Observable<TechTopic[]> {
    return this.db.all<TechTopic>('tech_topics').pipe(
      map(topics => topics.sort((a, b) =>
        (b.created_at ?? '').localeCompare(a.created_at ?? '')))
    );
  }

  create(title: string, note?: string): Observable<TechTopic> {
    const row = { title, status: 'not_started' as const, progress_pct: 0 };
    return this.db.insert<TechTopic>('tech_topics', note ? { ...row, note } : row);
  }

  setProgress(id: string, progressPct: number): Observable<TechTopic> {
    const pct = Math.min(100, Math.max(0, progressPct));
    const status: TechTopic['status'] =
      pct === 0 ? 'not_started' : pct === 100 ? 'done' : 'in_progress';
    return this.db.update<TechTopic>('tech_topics', id, { progress_pct: pct, status });
  }

  remove(id: string): Observable<void> {
    return this.db.remove('tech_topics', id);
  }
}
