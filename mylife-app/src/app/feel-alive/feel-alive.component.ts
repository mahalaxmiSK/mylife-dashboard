import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../core/services/toast.service';
import { FeelAliveService } from '../core/services/feel-alive.service';
import { FeelAliveItem } from '../core/services/models';

@Component({
  selector: 'app-feel-alive',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './feel-alive.component.html',
  styleUrl: './feel-alive.component.scss'
})
export class FeelAliveComponent implements OnInit {
  private service = inject(FeelAliveService);
  private toast = inject(ToastService);

  items: FeelAliveItem[] = [];
  draft = '';
  loading = true;

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.service.list().subscribe({
      next: items => { this.items = items; this.loading = false; },
      error: () => { this.loading = false; this.toast.show('Could not load your list'); }
    });
  }

  add(): void {
    const text = this.draft.trim();
    if (!text) return;
    this.draft = '';
    this.service.create(text).subscribe({
      next: created => this.items.unshift(created),
      error: () => this.toast.show('Could not save that')
    });
  }

  toggle(item: FeelAliveItem): void {
    const previous = item.done;
    item.done = !item.done;
    this.service.update(item).subscribe({
      error: () => { item.done = previous; this.toast.show('Could not update that'); }
    });
  }

  remove(item: FeelAliveItem): void {
    const index = this.items.indexOf(item);
    this.items.splice(index, 1);
    this.service.remove(item.id).subscribe({
      error: () => {
        this.items.splice(index, 0, item);
        this.toast.show('Could not delete that');
      }
    });
  }
}
