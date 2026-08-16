import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BackupService } from '../core/services/backup.service';
import { ToastService } from '../core/services/toast.service';

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
export class HomeComponent {
  private backup = inject(BackupService);
  private toast = inject(ToastService);

  today = new Date();
  busy = false;

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

  async restore(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.busy) return;

    const confirmed = confirm(
      'Restoring replaces everything currently on this device. Continue?');
    if (!confirmed) return;

    this.busy = true;
    try {
      const count = await this.backup.restore(file);
      this.toast.show(`Restored ${count} items`);
      setTimeout(() => location.reload(), 800);
    } catch (error) {
      this.toast.show(error instanceof Error ? error.message : 'Restore failed');
    } finally {
      this.busy = false;
    }
  }
}
