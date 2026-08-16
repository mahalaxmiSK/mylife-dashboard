import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, switchMap } from 'rxjs';
import { ToastService } from '../core/services/toast.service';
import { RoutinesService } from '../core/services/routines.service';
import { DAY_TYPES, RoutineItem, RoutineTemplate, today } from '../core/services/models';

@Component({
  selector: 'app-routines',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './routines.component.html',
  styleUrl: './routines.component.scss'
})
export class RoutinesComponent {
  private service = inject(RoutinesService);
  private toast = inject(ToastService);

  readonly dayTypes = DAY_TYPES;

  /** Nothing is open until a tile is tapped, so no template is created unasked. */
  activeType: RoutineTemplate['day_type'] | null = null;
  active: RoutineTemplate | null = null;
  items: RoutineItem[] = [];

  draftItem = '';
  loading = false;
  /** Steps ticked today, loaded alongside the template's steps. */
  checked = new Set<string>();

  /**
   * Opens the template for a day type, creating it the first time. Steps and
   * today's ticks arrive together so the list never renders briefly unticked.
   */
  selectDay(type: RoutineTemplate['day_type']): void {
    this.activeType = type;
    this.active = null;
    this.items = [];
    this.checked.clear();
    this.loading = true;

    this.service.templateFor(type).pipe(
      switchMap(template => {
        this.active = template;
        return forkJoin({
          items: this.service.items(template.id),
          ticked: this.service.tickedOn(today())
        });
      })
    ).subscribe({
      next: ({ items, ticked }) => {
        this.checked = new Set(ticked);
        this.items = items;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.show('Could not load that routine');
      }
    });
  }

  addItem(): void {
    const text = this.draftItem.trim();
    if (!text || !this.active) return;
    this.draftItem = '';
    this.service.addItem(this.active.id, text, this.items.length).subscribe({
      next: created => this.items.push(created),
      error: () => this.toast.show('Could not add that step')
    });
  }

  removeItem(item: RoutineItem): void {
    const index = this.items.indexOf(item);
    this.items.splice(index, 1);
    this.checked.delete(item.id);
    this.service.removeItem(item.id).subscribe({
      error: () => {
        this.items.splice(index, 0, item);
        this.toast.show('Could not delete that step');
      }
    });
  }

  /**
   * Moves a step by one place. Up and down buttons rather than drag: they stay
   * reachable by keyboard (REQ-NFR-03) and work one-handed (REQ-GEN-04).
   */
  move(item: RoutineItem, delta: number): void {
    const from = this.items.indexOf(item);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= this.items.length) return;

    const previous = this.items;
    const next = [...this.items];
    next.splice(from, 1);
    next.splice(to, 0, item);
    this.items = next;

    this.service.reorder(next).subscribe({
      error: () => {
        this.items = previous;
        this.toast.show('Could not reorder those steps');
      }
    });
  }

  /** Optimistic: the tick lands immediately and rolls back if the write fails. */
  toggle(item: RoutineItem): void {
    const wasChecked = this.checked.has(item.id);
    const date = today();

    if (wasChecked) this.checked.delete(item.id);
    else this.checked.add(item.id);

    const write = wasChecked
      ? this.service.untick(item.id, date)
      : this.service.tick(item.id, date);

    write.subscribe({
      error: () => {
        if (wasChecked) this.checked.add(item.id);
        else this.checked.delete(item.id);
        this.toast.show('Could not save that step');
      }
    });
  }
}
