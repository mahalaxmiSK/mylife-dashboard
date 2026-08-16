import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { TechReadsService } from './tech-reads.service';
import { LocalDbService } from './local-db.service';

describe('TechReadsService', () => {
  let service: TechReadsService;
  let db: LocalDbService;

  beforeEach(async () => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TechReadsService);
    db = TestBed.inject(LocalDbService);
    await db.clearAll();
  });

  it('keeps the note saying why a topic is worth the time', async () => {
    await firstValueFrom(service.create('Angular signals', 'The stable core now; everything else assumes it'));

    const [saved] = await firstValueFrom(service.list());

    expect(saved.note).toBe('The stable core now; everything else assumes it');
  });

  it('starts a new topic at nothing done', async () => {
    const created = await firstValueFrom(service.create('Angular signals'));

    expect(created.progress_pct).toBe(0);
    expect(created.status).toBe('not_started');
    expect(created.note).toBeUndefined();
  });

  it('calls a topic in progress once it is part way', async () => {
    const created = await firstValueFrom(service.create('EF Core'));

    const updated = await firstValueFrom(service.setProgress(created.id, 40));

    expect(updated.status).toBe('in_progress');
  });

  it('calls a topic done at the end', async () => {
    const created = await firstValueFrom(service.create('EF Core'));

    const updated = await firstValueFrom(service.setProgress(created.id, 100));

    expect(updated.status).toBe('done');
  });

  it('refuses progress beyond the ends of the scale', async () => {
    const created = await firstValueFrom(service.create('EF Core'));

    expect((await firstValueFrom(service.setProgress(created.id, 150))).progress_pct).toBe(100);
    expect((await firstValueFrom(service.setProgress(created.id, -20))).progress_pct).toBe(0);
  });

  it('keeps the note when progress changes', async () => {
    const created = await firstValueFrom(service.create('EF Core', 'Query performance first'));

    await firstValueFrom(service.setProgress(created.id, 50));

    const [saved] = await firstValueFrom(service.list());
    expect(saved.note).toBe('Query performance first');
  });
});
