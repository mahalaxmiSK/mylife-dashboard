import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../core/services/toast.service';
import { forkJoin } from 'rxjs';
import { RoutinesService } from '../core/services/routines.service';
import { RoutineItem, RoutineTemplate, today } from '../core/services/models';

@Component({
  selector: 'app-routines',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './routines.component.html',
  styleUrl: './routines.component.scss'
})
export class RoutinesComponent implements OnInit {
  private service = inject(RoutinesService);
  private toast = inject(ToastService);

  readonly dayTypes: RoutineTemplate['day_type'][] =
    ['lazy', 'reset', 'creative', 'focused'];

  templates: RoutineTemplate[] = [];
  active: RoutineTemplate | null = null;
  items: RoutineItem[] = [];

  newTemplateTitle = '';
  newTemplateType: RoutineTemplate['day_type'] = 'lazy';
  draftItem = '';

  loading = true;
  /** Steps ticked today, loaded alongside the template's steps. */
  checked = new Set<string>();

  ngOnInit(): void {
    this.service.templates().subscribe({
      next: templates => {
        this.templates = templates;
        this.loading = false;
        if (templates.length) this.open(templates[0]);
      },
      error: () => { this.loading = false; this.toast.show('Could not load your routines'); }
    });
  }

  /**
   * Steps and today's ticks are fetched together so the list never renders
   * briefly unticked before the ticks arrive.
   */
  open(template: RoutineTemplate): void {
    this.active = template;
    this.items = [];
    this.checked.clear();

    forkJoin({
      items: this.service.items(template.id),
      ticked: this.service.tickedOn(today())
    }).subscribe({
      next: ({ items, ticked }) => {
        this.checked = new Set(ticked);
        this.items = items;
      },
      error: () => this.toast.show('Could not load that routine')
    });
  }

  createTemplate(): void {
    const title = this.newTemplateTitle.trim();
    if (!title) return;
    this.newTemplateTitle = '';
    this.service.createTemplate(this.newTemplateType, title).subscribe(created => {
      this.templates.push(created);
      this.open(created);
    });
  }

  addItem(): void {
    const text = this.draftItem.trim();
    if (!text || !this.active) return;
    this.draftItem = '';
    this.service.addItem(this.active.id, text, this.items.length)
      .subscribe(created => this.items.push(created));
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
