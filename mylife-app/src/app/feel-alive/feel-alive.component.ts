import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../core/services/toast.service';
import { FeelAliveService } from '../core/services/feel-alive.service';
import { FeelAliveItem } from '../core/services/models';

/** Matches the CSS transition on the wheel. */
const SPIN_MS = 2600;
/** Whole turns before settling, so it reads as a spin rather than a jump. */
const SPIN_TURNS = 4;
/** More slices than this and the labels stop being readable. */
const MAX_SEGMENTS = 8;

/**
 * Where the wheel should come to rest so that slice `index` sits under the
 * pointer at the top, expressed as an absolute rotation that is always larger
 * than the current one — the wheel must never appear to turn backwards.
 */
export function nextRotation(current: number, index: number, count: number): number {
  const step = 360 / count;
  const resting = 360 - (index * step + step / 2);
  let delta = resting - (current % 360);
  if (delta <= 0) delta += 360;
  return current + SPIN_TURNS * 360 + delta;
}

@Component({
  selector: 'app-feel-alive',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './feel-alive.component.html',
  styleUrl: './feel-alive.component.scss'
})
export class FeelAliveComponent implements OnInit, OnDestroy {
  private service = inject(FeelAliveService);
  private toast = inject(ToastService);

  items: FeelAliveItem[] = [];
  draft = '';
  loading = true;

  picked: FeelAliveItem | null = null;
  spinning = false;
  /** Accumulates, never resets, so the wheel only ever turns forwards. */
  rotation = 0;
  private spinTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    clearTimeout(this.spinTimer);
  }

  /**
   * What the wheel offers: things not done yet, since a done item has already
   * been had. Once everything is done the whole list comes back rather than
   * leaving an empty wheel.
   */
  get wheelItems(): FeelAliveItem[] {
    const undone = this.items.filter(i => !i.done);
    return (undone.length ? undone : this.items).slice(0, MAX_SEGMENTS);
  }

  /**
   * Slice boundaries for the conic-gradient, as a ready-made CSS value.
   *
   * Two alternating tones leave the first and last slice matching whenever the
   * count is odd, and they meet at the wrap — so three items look like two. A
   * hairline at every boundary keeps the slices countable at any number.
   */
  get wheelGradient(): string {
    const count = this.wheelItems.length;
    if (!count) return 'var(--surface)';
    const step = 360 / count;
    const slices = this.wheelItems.map((_, i) => {
      const shade = i % 2 === 0 ? 'var(--accent)' : 'var(--border)';
      return `${shade} ${i * step}deg ${(i + 1) * step}deg`;
    });
    const boundaries =
      `repeating-conic-gradient(var(--surface) 0deg 1deg, transparent 1deg ${step}deg)`;
    return `${boundaries}, conic-gradient(${slices.join(', ')})`;
  }

  /** REQ-ALIVE-01: the wheel lands on the item, it does not merely animate. */
  spin(): void {
    const candidates = this.wheelItems;
    if (!candidates.length || this.spinning) return;

    const index = Math.floor(Math.random() * candidates.length);
    this.rotation = nextRotation(this.rotation, index, candidates.length);

    this.picked = candidates[index];
    this.spinning = true;
    clearTimeout(this.spinTimer);
    this.spinTimer = setTimeout(() => this.spinning = false, SPIN_MS);
  }

  /** REQ-ALIVE-02: the same choice without waiting for the animation. */
  pickRandom(): void {
    const candidates = this.wheelItems;
    if (!candidates.length) return;
    this.picked = candidates[Math.floor(Math.random() * candidates.length)];
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
