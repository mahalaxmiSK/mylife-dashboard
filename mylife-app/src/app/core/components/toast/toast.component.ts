import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (message) {
      <div class="toast">{{ message }}</div>
    }
  `,
  styles: [`
    .toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--text);
      color: #fff;
      padding: 10px 20px;
      border-radius: 20px;
      font-size: 13px;
      z-index: 9999;
      animation: fadein 0.2s ease;
    }
    @keyframes fadein { from { opacity: 0; transform: translateX(-50%) translateY(8px); } }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  message = '';
  private sub!: Subscription;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private toast: ToastService) {}

  ngOnInit(): void {
    this.sub = this.toast.messages$.subscribe(msg => {
      this.message = msg;
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => { this.message = ''; }, 3000);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    if (this.timer) clearTimeout(this.timer);
  }
}
