import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { BackupService } from '../core/services/backup.service';
import { ToastService } from '../core/services/toast.service';
import { AuthService } from '../core/services/auth.service';
import { MigrationService } from '../core/services/migration.service';

interface WorkspaceCard {
  route: string;
  icon: string;
  title: string;
  subtitle: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private backup = inject(BackupService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);
  private migration = inject(MigrationService);
  private router = inject(Router);

  today = new Date();
  busy = false;

  /** Shown only while there is local data that has never been uploaded. */
  offerMigration = false;
  migrating = false;

  /**
   * REQ-HOME-01 asks for emoji rather than abstract glyphs, and REQ-HOME-02 for
   * subtitles that describe what each module actually does. A card that
   * promises a step or a feature the module lacks is the defect being fixed
   * here, so these are written against the built behaviour, not the ambition.
   *
   * Habits gets a seedling rather than the usual flame: a streak counter is
   * already quite enough pressure, and REQ-GEN-05 rules out the rest.
   */
  cards: WorkspaceCard[] = [
    { route: '/routines',   icon: '🌤️', title: 'Day Routines',  subtitle: 'Lazy · Reset · Creative · Focused' },
    { route: '/eq',         icon: '💭', title: 'EQ Check-in',   subtitle: 'Name it · Explore · Suggestions' },
    { route: '/feel-alive', icon: '✨', title: 'Feel Alive',    subtitle: 'Spin the wheel, or just pick one' },
    { route: '/tech-reads', icon: '📚', title: 'Tech Reads',    subtitle: 'Track what you are learning' },
    { route: '/habits',     icon: '🌱', title: 'Habits',        subtitle: "Today's list, and your streaks" },
    { route: '/challenges', icon: '🏔️', title: 'Challenges',    subtitle: 'Daily rules, day by day' }
  ];

  async ngOnInit(): Promise<void> {
    // Offered once, and only when there is genuinely something to move.
    const [hasLocal, done] = await Promise.all([
      this.migration.hasLocalData(),
      this.migration.alreadyMigrated()
    ]);
    this.offerMigration = hasLocal && !done;
  }

  get greeting(): string {
    const hour = this.today.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  async download(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    try {
      await this.backup.download();
      this.toast.show('Backup downloaded');
    } catch {
      this.toast.show('Could not create the backup');
    } finally {
      this.busy = false;
    }
  }

  /** REQ-SYNC-06. Nothing local is deleted, so this is safe to try. */
  async uploadLocal(): Promise<void> {
    if (this.migrating) return;
    this.migrating = true;
    try {
      const report = await this.migration.run();
      this.offerMigration = false;
      this.toast.show(
        report.skipped
          ? `Uploaded ${report.uploaded} items, skipped ${report.skipped} already there`
          : `Uploaded ${report.uploaded} items`
      );
      setTimeout(() => location.reload(), 1200);
    } catch {
      this.toast.show('Could not upload. Your local copy is untouched.');
    } finally {
      this.migrating = false;
    }
  }

  /** REQ-SYNC-08: clears the session, leaves remote data alone. */
  signOut(): void {
    this.auth.signOut().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.toast.show('Could not sign out')
    });
  }
}
