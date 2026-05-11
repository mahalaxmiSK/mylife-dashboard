import { Component } from '@angular/core';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  template: `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;gap:12px;">
      <p style="font-size:18px;color:var(--text);">Access restricted.</p>
      <a href="/.auth/logout" style="font-size:13px;color:var(--text-muted);">Sign out</a>
    </div>
  `
})
export class UnauthorizedComponent {}
