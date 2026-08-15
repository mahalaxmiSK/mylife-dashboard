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

  cards: WorkspaceCard[] = [
    { route: '/routines',   icon: '☀',  title: 'Day Routines',  subtitle: 'Lazy · Reset · Creative · Focused' },
    { route: '/eq',         icon: '❋',  title: 'EQ Check-in',   subtitle: 'Name it · Explore · Act' },
    { route: '/feel-alive', icon: '✦',  title: 'Feel Alive',    subtitle: 'Things that light you up' },
    { route: '/tech-reads', icon: '◈',  title: 'Tech Reads',    subtitle: 'Learn · Track progress' },
    { route: '/habits',     icon: '◉',  title: 'Habits',        subtitle: 'Daily streaks' },
    { route: '/challenges', icon: '⚑',  title: 'Challenges',    subtitle: 'Commit · Track · Finish' }
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
