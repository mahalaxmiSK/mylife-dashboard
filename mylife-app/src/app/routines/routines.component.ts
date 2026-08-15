import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../core/services/toast.service';
import { RoutinesService } from '../core/services/routines.service';
import { RoutineItem, RoutineTemplate } from '../core/services/models';

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
  /** Ticked items are session-only: the schema stores the template, not daily runs. */
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

  open(template: RoutineTemplate): void {
    this.active = template;
    this.items = [];
    this.checked.clear();
    this.service.items(template.id).subscribe(items => this.items = items);
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
    this.service.removeItem(item.id).subscribe({
      error: () => {
        this.items.splice(index, 0, item);
        this.toast.show('Could not delete that step');
      }
    });
  }

  toggle(item: RoutineItem): void {
    if (this.checked.has(item.id)) this.checked.delete(item.id);
    else this.checked.add(item.id);
  }
}
