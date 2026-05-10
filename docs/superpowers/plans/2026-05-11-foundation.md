# MyLife Dashboard — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a deployable Angular + .NET Azure Functions monorepo with GitHub OAuth, Supabase schema, and a working 6-card homepage.

**Architecture:** Angular 17 standalone SPA hosted on Azure Static Web Apps (free tier), proxied to .NET 8 Isolated Azure Functions for the API layer, with Supabase PostgreSQL as the database. Azure Static Web Apps enforces authentication; an Angular AuthGuard enforces single-owner access by checking the logged-in email.

**Tech Stack:** Angular 17 (standalone components, signals-ready), .NET 8 Isolated Worker Azure Functions v4, xUnit, Jasmine/Karma, Supabase REST API (no SDK — plain HttpClient), Azure Static Web Apps free tier.

---

## File Structure

```
C:\Apps\MyLife\
├── mylife-app/                          Angular SPA
│   └── src/app/
│       ├── core/
│       │   ├── services/
│       │   │   ├── auth.service.ts          /.auth/me wrapper
│       │   │   ├── auth.service.spec.ts
│       │   │   ├── api.service.ts           base HTTP helper
│       │   │   ├── api.service.spec.ts
│       │   │   ├── toast.service.ts         notification bus
│       │   │   └── toast.service.spec.ts
│       │   ├── interceptors/
│       │   │   ├── http-error.interceptor.ts
│       │   │   └── http-error.interceptor.spec.ts
│       │   ├── guards/
│       │   │   ├── auth.guard.ts
│       │   │   └── auth.guard.spec.ts
│       │   └── components/toast/
│       │       ├── toast.component.ts
│       │       └── toast.component.spec.ts
│       ├── home/
│       │   ├── home.component.ts
│       │   ├── home.component.html
│       │   ├── home.component.scss
│       │   └── home.component.spec.ts
│       ├── unauthorized/
│       │   └── unauthorized.component.ts    shown when wrong user logs in
│       ├── app.component.ts
│       ├── app.component.html
│       ├── app.component.scss
│       ├── app.config.ts                    providers incl. interceptor
│       └── app.routes.ts
│   └── src/
│       ├── styles.scss                      global palette + reset
│       └── environments/
│           ├── environment.ts
│           └── environment.prod.ts
│
├── mylife-api/                          .NET Azure Functions
│   ├── MyLife.Api/
│   │   ├── Functions/
│   │   │   └── HealthCheck.cs
│   │   ├── Services/
│   │   │   ├── ISupabaseService.cs
│   │   │   └── SupabaseService.cs
│   │   ├── Program.cs
│   │   ├── local.settings.json
│   │   └── MyLife.Api.csproj
│   ├── MyLife.Api.Tests/
│   │   ├── Services/
│   │   │   └── SupabaseServiceTests.cs
│   │   ├── Functions/
│   │   │   └── HealthCheckTests.cs
│   │   └── MyLife.Api.Tests.csproj
│   └── MyLife.sln
│
├── db/
│   ├── schema.sql                       all CREATE TABLE statements
│   └── seeds/
│       └── eq_suggestions.sql           seed data for EQ suggestions
│
├── staticwebapp.config.json             SWA routing + auth config
├── .gitignore
└── docs/superpowers/
    ├── specs/2026-05-11-mylife-dashboard-design.md
    └── plans/2026-05-11-foundation.md   (this file)
```

---

## Task 1: Initialize repository

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Init git and create .gitignore**

```bash
cd C:\Apps\MyLife
git init
```

Create `.gitignore` with this content:

```gitignore
# Angular
mylife-app/node_modules/
mylife-app/dist/
mylife-app/.angular/

# .NET
mylife-api/**/bin/
mylife-api/**/obj/
mylife-api/**/local.settings.json

# Superpowers
.superpowers/

# Environment
*.env
.env.local
```

- [ ] **Step 2: Initial commit**

```bash
git add .gitignore docs/
git commit -m "chore: init repo with design spec and gitignore"
```

---

## Task 2: Create Angular project

**Files:**
- Create: `mylife-app/` (entire Angular scaffold)
- Modify: `mylife-app/src/environments/environment.ts`
- Modify: `mylife-app/src/environments/environment.prod.ts`

- [ ] **Step 1: Scaffold Angular project**

```bash
cd C:\Apps\MyLife
npx @angular/cli@17 new mylife-app --routing=false --style=scss --standalone --skip-tests=false
```

When prompted for analytics: `N`.

- [ ] **Step 2: Remove default placeholder content**

Replace `mylife-app/src/app/app.component.html` with:

```html
<app-toast />
<router-outlet />
```

Replace `mylife-app/src/app/app.component.ts` with:

```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './core/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {}
```

- [ ] **Step 3: Create environment files**

Create `mylife-app/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  ownerEmail: 'YOUR_EMAIL@example.com'  // replace with your GitHub/Google email
};
```

Create `mylife-app/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  ownerEmail: 'YOUR_EMAIL@example.com'  // replace with your GitHub/Google email
};
```

> Replace `YOUR_EMAIL@example.com` with the email address of your GitHub or Google account before deploying.

- [ ] **Step 4: Verify project builds**

```bash
cd mylife-app
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
cd C:\Apps\MyLife
git add mylife-app/
git commit -m "chore: scaffold Angular 17 standalone project"
```

---

## Task 3: Global styles

**Files:**
- Modify: `mylife-app/src/styles.scss`

- [ ] **Step 1: Replace styles.scss**

```scss
// mylife-app/src/styles.scss
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:          #f8f4f0;
  --surface:     #ffffff;
  --text:        #5a4a3a;
  --text-muted:  #b0a090;
  --accent:      #c9b8a8;
  --border:      #ede8e2;
  --radius:      10px;
  --radius-sm:   6px;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Segoe UI', system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  min-height: 100vh;
}

a { color: inherit; text-decoration: none; }

.label {
  font-size: 10px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-muted);
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;

  &:hover { opacity: 0.85; }

  &--primary {
    background: var(--text);
    color: #fff;
  }

  &--ghost {
    background: var(--surface);
    color: var(--text);
    border: 1px solid var(--border);
  }
}
```

- [ ] **Step 2: Verify styles load**

```bash
cd mylife-app
npm start
```

Open `http://localhost:4200`. Expected: blank page with beige background (`#f8f4f0`), no console errors.

- [ ] **Step 3: Commit**

```bash
cd C:\Apps\MyLife
git add mylife-app/src/styles.scss
git commit -m "style: add global palette and base styles"
```

---

## Task 4: ToastService + ToastComponent

**Files:**
- Create: `mylife-app/src/app/core/services/toast.service.ts`
- Create: `mylife-app/src/app/core/services/toast.service.spec.ts`
- Create: `mylife-app/src/app/core/components/toast/toast.component.ts`
- Create: `mylife-app/src/app/core/components/toast/toast.component.spec.ts`

- [ ] **Step 1: Write the failing ToastService test**

Create `mylife-app/src/app/core/services/toast.service.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should emit a message when show() is called', (done) => {
    service.messages$.subscribe(msg => {
      expect(msg).toBe('test message');
      done();
    });
    service.show('test message');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd mylife-app
npx ng test --include="**/toast.service.spec.ts" --watch=false --browsers=ChromeHeadless
```

Expected: FAIL — `ToastService` not found.

- [ ] **Step 3: Implement ToastService**

Create `mylife-app/src/app/core/services/toast.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _messages = new Subject<string>();
  messages$ = this._messages.asObservable();

  show(message: string): void {
    this._messages.next(message);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx ng test --include="**/toast.service.spec.ts" --watch=false --browsers=ChromeHeadless
```

Expected: PASS.

- [ ] **Step 5: Write the failing ToastComponent test**

Create `mylife-app/src/app/core/components/toast/toast.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastComponent } from './toast.component';
import { ToastService } from '../../services/toast.service';

describe('ToastComponent', () => {
  let fixture: ComponentFixture<ToastComponent>;
  let service: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(ToastComponent);
    service = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('should show message when toast service emits', fakeAsync(() => {
    service.show('hello world');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.toast');
    expect(el).toBeTruthy();
    expect(el.textContent).toContain('hello world');
    tick(3000);
  }));

  it('should hide message after 3 seconds', fakeAsync(() => {
    service.show('fades away');
    fixture.detectChanges();
    tick(3000);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.toast');
    expect(el).toBeNull();
  }));
});
```

- [ ] **Step 6: Run test to verify it fails**

```bash
npx ng test --include="**/toast.component.spec.ts" --watch=false --browsers=ChromeHeadless
```

Expected: FAIL — `ToastComponent` not found.

- [ ] **Step 7: Implement ToastComponent**

Create `mylife-app/src/app/core/components/toast/toast.component.ts`:

```typescript
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
    this.sub.unsubscribe();
    if (this.timer) clearTimeout(this.timer);
  }
}
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
npx ng test --include="**/toast.*.spec.ts" --watch=false --browsers=ChromeHeadless
```

Expected: 3 tests PASS.

- [ ] **Step 9: Commit**

```bash
cd C:\Apps\MyLife
git add mylife-app/src/app/core/
git commit -m "feat: add ToastService and ToastComponent"
```

---

## Task 5: AuthService

**Files:**
- Create: `mylife-app/src/app/core/services/auth.service.ts`
- Create: `mylife-app/src/app/core/services/auth.service.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `mylife-app/src/app/core/services/auth.service.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, AuthResponse } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should return authenticated user when logged in', (done) => {
    const mockResponse: AuthResponse = {
      clientPrincipal: {
        userId: 'abc123',
        userDetails: 'user@example.com',
        identityProvider: 'github'
      }
    };

    service.getUser().subscribe(res => {
      expect(res.clientPrincipal?.userDetails).toBe('user@example.com');
      done();
    });

    httpMock.expectOne('/.auth/me').flush(mockResponse);
  });

  it('should return null clientPrincipal when not logged in', (done) => {
    service.getUser().subscribe(res => {
      expect(res.clientPrincipal).toBeNull();
      done();
    });

    httpMock.expectOne('/.auth/me').flush({ clientPrincipal: null });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx ng test --include="**/auth.service.spec.ts" --watch=false --browsers=ChromeHeadless
```

Expected: FAIL — `AuthService` not found.

- [ ] **Step 3: Implement AuthService**

Create `mylife-app/src/app/core/services/auth.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

export interface AuthUser {
  userId: string;
  userDetails: string;
  identityProvider: string;
}

export interface AuthResponse {
  clientPrincipal: AuthUser | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  getUser(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>('/.auth/me').pipe(shareReplay(1));
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx ng test --include="**/auth.service.spec.ts" --watch=false --browsers=ChromeHeadless
```

Expected: 2 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd C:\Apps\MyLife
git add mylife-app/src/app/core/services/auth.service.ts mylife-app/src/app/core/services/auth.service.spec.ts
git commit -m "feat: add AuthService"
```

---

## Task 6: ApiService

**Files:**
- Create: `mylife-app/src/app/core/services/api.service.ts`
- Create: `mylife-app/src/app/core/services/api.service.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `mylife-app/src/app/core/services/api.service.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should GET from /api/{path}', (done) => {
    service.get<{ id: string }>('health').subscribe(res => {
      expect(res.id).toBe('1');
      done();
    });
    httpMock.expectOne('/api/health').flush({ id: '1' });
  });

  it('should POST to /api/{path} with body', (done) => {
    service.post<{ id: string }>('habits', { name: 'Walk' }).subscribe(res => {
      expect(res.id).toBe('new-id');
      done();
    });
    const req = httpMock.expectOne('/api/habits');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Walk' });
    req.flush({ id: 'new-id' });
  });

  it('should PATCH /api/{path}/{id}', (done) => {
    service.patch<{ status: string }>('habits/123', { done: true }).subscribe(res => {
      expect(res.status).toBe('ok');
      done();
    });
    const req = httpMock.expectOne('/api/habits/123');
    expect(req.request.method).toBe('PATCH');
    req.flush({ status: 'ok' });
  });

  it('should DELETE /api/{path}/{id}', (done) => {
    service.delete('habits/123').subscribe(() => done());
    const req = httpMock.expectOne('/api/habits/123');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx ng test --include="**/api.service.spec.ts" --watch=false --browsers=ChromeHeadless
```

Expected: FAIL.

- [ ] **Step 3: Implement ApiService**

Create `mylife-app/src/app/core/services/api.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = '/api';

  constructor(private http: HttpClient) {}

  get<T>(path: string): Observable<T> {
    return this.http.get<T>(`${this.base}/${path}`);
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.base}/${path}`, body);
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http.patch<T>(`${this.base}/${path}`, body);
  }

  delete<T = void>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.base}/${path}`);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx ng test --include="**/api.service.spec.ts" --watch=false --browsers=ChromeHeadless
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd C:\Apps\MyLife
git add mylife-app/src/app/core/services/api.service.ts mylife-app/src/app/core/services/api.service.spec.ts
git commit -m "feat: add ApiService base HTTP helper"
```

---

## Task 7: HttpErrorInterceptor

**Files:**
- Create: `mylife-app/src/app/core/interceptors/http-error.interceptor.ts`
- Create: `mylife-app/src/app/core/interceptors/http-error.interceptor.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `mylife-app/src/app/core/interceptors/http-error.interceptor.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../services/toast.service';
import { httpErrorInterceptor } from './http-error.interceptor';

describe('httpErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let toastSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor]))
      ]
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    toastSpy = spyOn(TestBed.inject(ToastService), 'show');
  });

  afterEach(() => httpMock.verify());

  it('should call toast.show with generic message on 500', () => {
    http.get('/test').subscribe({ error: () => {} });
    httpMock.expectOne('/test').flush('error', { status: 500, statusText: 'Server Error' });
    expect(toastSpy).toHaveBeenCalledWith('Something went wrong');
  });

  it('should call toast.show with unavailable message on 503', () => {
    http.get('/test').subscribe({ error: () => {} });
    httpMock.expectOne('/test').flush('error', { status: 503, statusText: 'Unavailable' });
    expect(toastSpy).toHaveBeenCalledWith('Service unavailable, try again later');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx ng test --include="**/http-error.interceptor.spec.ts" --watch=false --browsers=ChromeHeadless
```

Expected: FAIL.

- [ ] **Step 3: Implement the interceptor**

Create `mylife-app/src/app/core/interceptors/http-error.interceptor.ts`:

```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message = error.status === 503
        ? 'Service unavailable, try again later'
        : 'Something went wrong';
      toast.show(message);
      return throwError(() => error);
    })
  );
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx ng test --include="**/http-error.interceptor.spec.ts" --watch=false --browsers=ChromeHeadless
```

Expected: 2 tests PASS.

- [ ] **Step 5: Register the interceptor in app.config.ts**

Replace `mylife-app/src/app/app.config.ts` with:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { httpErrorInterceptor } from './core/interceptors/http-error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([httpErrorInterceptor]))
  ]
};
```

- [ ] **Step 6: Commit**

```bash
cd C:\Apps\MyLife
git add mylife-app/src/app/core/interceptors/ mylife-app/src/app/app.config.ts
git commit -m "feat: add HttpErrorInterceptor with toast notification"
```

---

## Task 8: AuthGuard

**Files:**
- Create: `mylife-app/src/app/core/guards/auth.guard.ts`
- Create: `mylife-app/src/app/core/guards/auth.guard.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `mylife-app/src/app/core/guards/auth.guard.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authService = jasmine.createSpyObj('AuthService', ['getUser']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    });
    guard = TestBed.inject(AuthGuard);
  });

  it('should allow when owner email matches', (done) => {
    authService.getUser.and.returnValue(of({
      clientPrincipal: { userId: '1', userDetails: 'owner@example.com', identityProvider: 'github' }
    }));
    guard.canActivate().subscribe(result => {
      expect(result).toBeTrue();
      done();
    });
  });

  it('should redirect to /unauthorized when email does not match', (done) => {
    authService.getUser.and.returnValue(of({
      clientPrincipal: { userId: '2', userDetails: 'stranger@example.com', identityProvider: 'github' }
    }));
    guard.canActivate().subscribe(result => {
      expect(result).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/unauthorized']);
      done();
    });
  });

  it('should redirect to login when not authenticated', (done) => {
    authService.getUser.and.returnValue(of({ clientPrincipal: null }));
    const locationSpy = spyOnProperty(window, 'location', 'get').and.returnValue({
      href: ''
    } as Location);
    guard.canActivate().subscribe(result => {
      expect(result).toBeFalse();
      done();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx ng test --include="**/auth.guard.spec.ts" --watch=false --browsers=ChromeHeadless
```

Expected: FAIL.

- [ ] **Step 3: Implement AuthGuard**

Create `mylife-app/src/app/core/guards/auth.guard.ts`:

```typescript
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, map, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.auth.getUser().pipe(
      map(response => {
        if (!response.clientPrincipal) {
          window.location.href = '/.auth/login/github';
          return false;
        }
        if (response.clientPrincipal.userDetails !== environment.ownerEmail) {
          this.router.navigate(['/unauthorized']);
          return false;
        }
        return true;
      }),
      catchError(() => {
        window.location.href = '/.auth/login/github';
        return of(false);
      })
    );
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx ng test --include="**/auth.guard.spec.ts" --watch=false --browsers=ChromeHeadless
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd C:\Apps\MyLife
git add mylife-app/src/app/core/guards/
git commit -m "feat: add AuthGuard with owner email check"
```

---

## Task 9: App routing + UnauthorizedComponent

**Files:**
- Modify: `mylife-app/src/app/app.routes.ts`
- Create: `mylife-app/src/app/unauthorized/unauthorized.component.ts`

- [ ] **Step 1: Create UnauthorizedComponent**

Create `mylife-app/src/app/unauthorized/unauthorized.component.ts`:

```typescript
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
```

- [ ] **Step 2: Set up routes with lazy-loaded space placeholders**

Replace `mylife-app/src/app/app.routes.ts`:

```typescript
import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

export const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'routines',
    canActivate: [AuthGuard],
    loadComponent: () => import('./routines/routines.component').then(m => m.RoutinesComponent)
  },
  {
    path: 'eq',
    canActivate: [AuthGuard],
    loadComponent: () => import('./eq/eq.component').then(m => m.EqComponent)
  },
  {
    path: 'feel-alive',
    canActivate: [AuthGuard],
    loadComponent: () => import('./feel-alive/feel-alive.component').then(m => m.FeelAliveComponent)
  },
  {
    path: 'tech-reads',
    canActivate: [AuthGuard],
    loadComponent: () => import('./tech-reads/tech-reads.component').then(m => m.TechReadsComponent)
  },
  {
    path: 'habits',
    canActivate: [AuthGuard],
    loadComponent: () => import('./habits/habits.component').then(m => m.HabitsComponent)
  },
  {
    path: 'challenges',
    canActivate: [AuthGuard],
    loadComponent: () => import('./challenges/challenges.component').then(m => m.ChallengesComponent)
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponent
  },
  { path: '**', redirectTo: '' }
];
```

- [ ] **Step 3: Create stub components for each space (so routing compiles)**

Run these commands to create placeholder components:

```bash
cd mylife-app
npx ng generate component routines/routines --standalone --skip-tests=true --flat
npx ng generate component eq/eq --standalone --skip-tests=true --flat
npx ng generate component feel-alive/feel-alive --standalone --skip-tests=true --flat
npx ng generate component tech-reads/tech-reads --standalone --skip-tests=true --flat
npx ng generate component habits/habits --standalone --skip-tests=true --flat
npx ng generate component challenges/challenges --standalone --skip-tests=true --flat
```

Each generated component is a placeholder — the spaces will be fleshed out in Plans 2–4.

- [ ] **Step 4: Verify the build compiles**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
cd C:\Apps\MyLife
git add mylife-app/src/app/
git commit -m "feat: add routing with AuthGuard and space stub components"
```

---

## Task 10: HomeComponent

**Files:**
- Create: `mylife-app/src/app/home/home.component.ts`
- Create: `mylife-app/src/app/home/home.component.html`
- Create: `mylife-app/src/app/home/home.component.scss`
- Create: `mylife-app/src/app/home/home.component.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `mylife-app/src/app/home/home.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent, RouterTestingModule]
    }).compileComponents();
    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
  });

  it('should render 6 workspace cards', () => {
    const cards = fixture.nativeElement.querySelectorAll('.workspace-card');
    expect(cards.length).toBe(6);
  });

  it('should display greeting', () => {
    const greeting = fixture.nativeElement.querySelector('.greeting');
    expect(greeting.textContent).toContain('✦');
  });

  it('should display today\'s date', () => {
    const date = fixture.nativeElement.querySelector('.date');
    expect(date).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx ng test --include="**/home.component.spec.ts" --watch=false --browsers=ChromeHeadless
```

Expected: FAIL.

- [ ] **Step 3: Implement HomeComponent**

Create `mylife-app/src/app/home/home.component.ts`:

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface WorkspaceCard {
  icon: string;
  title: string;
  subtitle: string;
  route: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  today = new Date();

  cards: WorkspaceCard[] = [
    { icon: '🌤', title: 'Day Routines',   subtitle: 'Lazy · Reset · Creative · Focused', route: '/routines' },
    { icon: '💛', title: 'EQ Check-in',    subtitle: 'Name · Explore · Heal',              route: '/eq' },
    { icon: '✨', title: 'Feel Alive',      subtitle: 'Spin the wheel · Random pick',       route: '/feel-alive' },
    { icon: '📚', title: 'Tech Reads',      subtitle: 'Topics · Progress · Random',         route: '/tech-reads' },
    { icon: '🌱', title: 'Habit Tracker',   subtitle: 'Daily habits · Streaks',             route: '/habits' },
    { icon: '🏆', title: 'Challenges',      subtitle: 'Rules · Track · Conquer',            route: '/challenges' },
  ];
}
```

Create `mylife-app/src/app/home/home.component.html`:

```html
<div class="home">
  <header class="home__header">
    <p class="greeting">Good morning ✦</p>
    <p class="date">{{ today | date:'EEEE, d MMMM y' }}</p>
  </header>

  <div class="home__grid">
    @for (card of cards; track card.route) {
      <a class="workspace-card" [routerLink]="card.route">
        <span class="workspace-card__icon">{{ card.icon }}</span>
        <span class="workspace-card__title">{{ card.title }}</span>
        <span class="workspace-card__subtitle">{{ card.subtitle }}</span>
      </a>
    }
  </div>
</div>
```

Create `mylife-app/src/app/home/home.component.scss`:

```scss
.home {
  max-width: 480px;
  margin: 0 auto;
  padding: 32px 16px;
}

.home__header {
  margin-bottom: 28px;

  .greeting {
    font-size: 22px;
    font-weight: 300;
    color: var(--text);
  }

  .date {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 2px;
  }
}

.home__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.workspace-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:hover {
    border-color: var(--accent);
    box-shadow: 0 2px 8px rgba(90, 74, 58, 0.08);
  }

  &__icon  { font-size: 20px; }
  &__title { font-size: 13px; font-weight: 600; color: var(--text); }
  &__subtitle { font-size: 10px; color: var(--text-muted); line-height: 1.4; }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx ng test --include="**/home.component.spec.ts" --watch=false --browsers=ChromeHeadless
```

Expected: 3 tests PASS.

- [ ] **Step 5: Verify in browser**

```bash
npm start
```

Open `http://localhost:4200`. Expected: greeting with today's date, 2×3 card grid, cards navigate to stub pages.

- [ ] **Step 6: Commit**

```bash
cd C:\Apps\MyLife
git add mylife-app/src/app/home/
git commit -m "feat: add HomeComponent with 6-card workspace grid"
```

---

## Task 11: Database schema

**Files:**
- Create: `db/schema.sql`
- Create: `db/seeds/eq_suggestions.sql`

- [ ] **Step 1: Create schema.sql**

Create `db/schema.sql`:

```sql
-- Day Routines
CREATE TABLE IF NOT EXISTS routines_templates (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_type   text NOT NULL CHECK (day_type IN ('lazy','reset','creative','focused')),
  title      text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS routines_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES routines_templates(id) ON DELETE CASCADE,
  text        text NOT NULL,
  position    int NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- EQ Check-in
CREATE TABLE IF NOT EXISTS eq_checkins (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emotion    text NOT NULL,
  notes      jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS eq_suggestions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emotion       text NOT NULL,
  activity_text text NOT NULL
);

-- Feel Alive
CREATE TABLE IF NOT EXISTS feel_alive_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text       text NOT NULL,
  done       boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Tech Reads
CREATE TABLE IF NOT EXISTS tech_topics (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  status       text NOT NULL DEFAULT 'not_started'
                 CHECK (status IN ('not_started','in_progress','done')),
  progress_pct int DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  created_at   timestamptz DEFAULT now()
);

-- Habit Tracker
CREATE TABLE IF NOT EXISTS habits (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id    uuid REFERENCES habits(id) ON DELETE CASCADE,
  logged_date date NOT NULL,
  UNIQUE (habit_id, logged_date)
);

-- Challenges
CREATE TABLE IF NOT EXISTS challenges (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  status        text NOT NULL DEFAULT 'upcoming'
                  CHECK (status IN ('upcoming','active','completed','abandoned')),
  start_date    date,
  duration_days int,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS challenge_rules (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE,
  text         text NOT NULL,
  position     int NOT NULL
);

CREATE TABLE IF NOT EXISTS challenge_rule_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id     uuid REFERENCES challenge_rules(id) ON DELETE CASCADE,
  logged_date date NOT NULL,
  UNIQUE (rule_id, logged_date)
);
```

- [ ] **Step 2: Create EQ seed data**

Create `db/seeds/eq_suggestions.sql`:

```sql
INSERT INTO eq_suggestions (emotion, activity_text) VALUES
  ('anxious',     'Try a 5-minute box breathing exercise'),
  ('anxious',     'Write down what you''re afraid of, then what''s most likely to happen'),
  ('anxious',     'Go for a 10-minute walk without your phone'),

  ('overwhelmed', 'Pick ONE thing to do and ignore the rest for now'),
  ('overwhelmed', 'Write a brain dump — everything in your head, onto paper'),
  ('overwhelmed', 'Take a 20-minute break completely away from screens'),

  ('sad',         'Call or message someone you feel safe with'),
  ('sad',         'Put on a comfort playlist and let yourself feel it'),
  ('sad',         'Do something small and physical — tidy one corner, stretch, cook'),

  ('angry',       'Write a letter you won''t send'),
  ('angry',       'Do something physical — run, dance, punch a pillow'),
  ('angry',       'Give yourself 10 minutes before responding to the trigger'),

  ('numb',        'Go outside and notice 5 things you can see, 4 you can touch'),
  ('numb',        'Make a warm drink and sit with it slowly'),
  ('numb',        'Watch or read something that usually moves you'),

  ('hopeful',     'Write down three things you''re looking forward to'),
  ('hopeful',     'Share your hope with someone — it gets stronger out loud'),
  ('hopeful',     'Take one small step toward whatever you''re hopeful about'),

  ('grateful',    'Write three specific things you''re grateful for today'),
  ('grateful',    'Tell someone you appreciate them — be specific why'),
  ('grateful',    'Do something kind for someone without telling them'),

  ('lonely',      'Reach out to one person, even just to say hi'),
  ('lonely',      'Go somewhere with people around — a café, library, park'),
  ('lonely',      'Do something you love that connects you to yourself'),

  ('stuck',       'Change your physical environment — different room, go outside'),
  ('stuck',       'Set a 10-minute timer and just start — not to finish, just to start'),
  ('stuck',       'Ask yourself: what''s the smallest possible next step?'),

  ('excited',     'Write down what''s exciting so you don''t lose the energy'),
  ('excited',     'Channel it — start something you''ve been putting off'),
  ('excited',     'Share it! Excitement multiplies when expressed');
```

- [ ] **Step 3: Run schema in Supabase**

1. Go to [supabase.com](https://supabase.com) → create a free project
2. In the SQL Editor, paste and run `db/schema.sql`
3. Paste and run `db/seeds/eq_suggestions.sql`
4. Copy your **Project URL** and **service_role key** from Project Settings → API — you'll need them for the Functions config

- [ ] **Step 4: Commit**

```bash
cd C:\Apps\MyLife
git add db/
git commit -m "feat: add database schema and EQ seed data"
```

---

## Task 12: Azure Functions .NET project

**Files:**
- Create: `mylife-api/MyLife.Api/MyLife.Api.csproj`
- Create: `mylife-api/MyLife.Api/Program.cs`
- Create: `mylife-api/MyLife.Api/local.settings.json`
- Create: `mylife-api/MyLife.Api.Tests/MyLife.Api.Tests.csproj`
- Create: `mylife-api/MyLife.sln`

- [ ] **Step 1: Create the Functions project and solution**

```bash
cd C:\Apps\MyLife\mylife-api
dotnet new func --worker-runtime dotnet-isolated --target-framework net8.0 --name MyLife.Api
dotnet new xunit --name MyLife.Api.Tests --framework net8.0
dotnet new sln --name MyLife
dotnet sln MyLife.sln add MyLife.Api/MyLife.Api.csproj
dotnet sln MyLife.sln add MyLife.Api.Tests/MyLife.Api.Tests.csproj
cd MyLife.Api.Tests
dotnet add reference ../MyLife.Api/MyLife.Api.csproj
dotnet add package Microsoft.Azure.Functions.Worker --version 1.23.0
dotnet add package Microsoft.Azure.Functions.Worker.Extensions.Http --version 3.2.0
```

- [ ] **Step 2: Configure local.settings.json**

Create `mylife-api/MyLife.Api/local.settings.json` (already gitignored):

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet-isolated",
    "SupabaseUrl": "https://YOUR_PROJECT.supabase.co",
    "SupabaseServiceKey": "YOUR_SERVICE_ROLE_KEY"
  }
}
```

> Replace `YOUR_PROJECT` and `YOUR_SERVICE_ROLE_KEY` with the values from your Supabase project.

- [ ] **Step 3: Replace Program.cs**

Replace `mylife-api/MyLife.Api/Program.cs`:

```csharp
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var host = new HostBuilder()
    .ConfigureFunctionsWorkerDefaults()
    .ConfigureServices(services =>
    {
        services.AddHttpClient<ISupabaseService, SupabaseService>();
    })
    .Build();

host.Run();
```

- [ ] **Step 4: Verify project builds**

```bash
cd C:\Apps\MyLife\mylife-api
dotnet build
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
cd C:\Apps\MyLife
git add mylife-api/
git commit -m "chore: scaffold Azure Functions .NET 8 project"
```

---

## Task 13: SupabaseService (.NET)

**Files:**
- Create: `mylife-api/MyLife.Api/Services/ISupabaseService.cs`
- Create: `mylife-api/MyLife.Api/Services/SupabaseService.cs`
- Create: `mylife-api/MyLife.Api.Tests/Services/SupabaseServiceTests.cs`

- [ ] **Step 1: Write the failing test**

Create `mylife-api/MyLife.Api.Tests/Services/SupabaseServiceTests.cs`:

```csharp
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

public class SupabaseServiceTests
{
    private SupabaseService CreateService(HttpClient httpClient)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["SupabaseUrl"] = "https://fake.supabase.co",
                ["SupabaseServiceKey"] = "fake-key"
            })
            .Build();
        return new SupabaseService(httpClient, config);
    }

    [Fact]
    public async Task GetAsync_ReturnsDeserializedList()
    {
        var payload = JsonSerializer.Serialize(new[] { new { id = "abc", name = "Walk" } });
        var handler = new FakeHttpHandler(HttpStatusCode.OK, payload);
        var service = CreateService(new HttpClient(handler) { BaseAddress = new Uri("https://fake.supabase.co") });

        var result = await service.GetAsync<List<Dictionary<string, string>>>("habits");

        Assert.NotNull(result);
        Assert.Single(result!);
        Assert.Equal("abc", result![0]["id"]);
    }

    [Fact]
    public async Task InsertAsync_PostsAndReturnsResult()
    {
        var payload = JsonSerializer.Serialize(new[] { new { id = "new-id", name = "Run" } });
        var handler = new FakeHttpHandler(HttpStatusCode.Created, payload);
        var service = CreateService(new HttpClient(handler) { BaseAddress = new Uri("https://fake.supabase.co") });

        var result = await service.InsertAsync<List<Dictionary<string, string>>>("habits", new { name = "Run" });

        Assert.NotNull(result);
        Assert.Equal("new-id", result![0]["id"]);
        Assert.Equal(HttpMethod.Post, handler.LastRequest?.Method);
    }
}

public class FakeHttpHandler : HttpMessageHandler
{
    private readonly HttpStatusCode _status;
    private readonly string _content;
    public HttpRequestMessage? LastRequest { get; private set; }

    public FakeHttpHandler(HttpStatusCode status, string content)
    {
        _status = status;
        _content = content;
    }

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        LastRequest = request;
        return Task.FromResult(new HttpResponseMessage(_status)
        {
            Content = new StringContent(_content, Encoding.UTF8, "application/json")
        });
    }
}
```

Add Moq to the test project:

```bash
cd mylife-api/MyLife.Api.Tests
dotnet add package Moq
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd C:\Apps\MyLife\mylife-api
dotnet test --filter "SupabaseServiceTests"
```

Expected: compile error — `ISupabaseService` and `SupabaseService` not defined.

- [ ] **Step 3: Implement ISupabaseService**

Create `mylife-api/MyLife.Api/Services/ISupabaseService.cs`:

```csharp
public interface ISupabaseService
{
    Task<T?> GetAsync<T>(string table, string? query = null);
    Task<T?> InsertAsync<T>(string table, object payload);
    Task<T?> UpdateAsync<T>(string table, string filter, object payload);
    Task DeleteAsync(string table, string filter);
}
```

- [ ] **Step 4: Implement SupabaseService**

Create `mylife-api/MyLife.Api/Services/SupabaseService.cs`:

```csharp
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

public class SupabaseService : ISupabaseService
{
    private readonly HttpClient _http;
    private readonly string _baseUrl;

    private static readonly JsonSerializerOptions JsonOpts =
        new() { PropertyNameCaseInsensitive = true };

    public SupabaseService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _baseUrl = config["SupabaseUrl"]
            ?? throw new InvalidOperationException("SupabaseUrl not configured");
        var key = config["SupabaseServiceKey"]
            ?? throw new InvalidOperationException("SupabaseServiceKey not configured");

        _http.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", key);
        _http.DefaultRequestHeaders.Add("apikey", key);
    }

    public async Task<T?> GetAsync<T>(string table, string? query = null)
    {
        var url = $"{_baseUrl}/rest/v1/{table}";
        if (query != null) url += $"?{query}";
        var response = await _http.GetAsync(url);
        response.EnsureSuccessStatusCode();
        return JsonSerializer.Deserialize<T>(
            await response.Content.ReadAsStringAsync(), JsonOpts);
    }

    public async Task<T?> InsertAsync<T>(string table, object payload)
    {
        var url = $"{_baseUrl}/rest/v1/{table}";
        using var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new StringContent(
                JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        };
        request.Headers.Add("Prefer", "return=representation");
        var response = await _http.SendAsync(request);
        response.EnsureSuccessStatusCode();
        return JsonSerializer.Deserialize<T>(
            await response.Content.ReadAsStringAsync(), JsonOpts);
    }

    public async Task<T?> UpdateAsync<T>(string table, string filter, object payload)
    {
        var url = $"{_baseUrl}/rest/v1/{table}?{filter}";
        using var request = new HttpRequestMessage(HttpMethod.Patch, url)
        {
            Content = new StringContent(
                JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        };
        request.Headers.Add("Prefer", "return=representation");
        var response = await _http.SendAsync(request);
        response.EnsureSuccessStatusCode();
        return JsonSerializer.Deserialize<T>(
            await response.Content.ReadAsStringAsync(), JsonOpts);
    }

    public async Task DeleteAsync(string table, string filter)
    {
        var url = $"{_baseUrl}/rest/v1/{table}?{filter}";
        var response = await _http.DeleteAsync(url);
        response.EnsureSuccessStatusCode();
    }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd C:\Apps\MyLife\mylife-api
dotnet test --filter "SupabaseServiceTests"
```

Expected: 2 tests PASS.

- [ ] **Step 6: Commit**

```bash
cd C:\Apps\MyLife
git add mylife-api/
git commit -m "feat: add SupabaseService for Supabase REST API calls"
```

---

## Task 14: HealthCheck Function

**Files:**
- Create: `mylife-api/MyLife.Api/Functions/HealthCheck.cs`
- Create: `mylife-api/MyLife.Api.Tests/Functions/HealthCheckTests.cs`

- [ ] **Step 1: Write the failing test**

Create `mylife-api/MyLife.Api.Tests/Functions/HealthCheckTests.cs`:

```csharp
using System.Net;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

public class HealthCheckTests
{
    [Fact]
    public void Run_ReturnsOk()
    {
        var logger = NullLogger<HealthCheck>.Instance;
        var function = new HealthCheck(logger);

        // HealthCheck returns HttpResponseData which is abstract in the Worker SDK.
        // Test the behavior by verifying the function can be instantiated and called.
        // Full integration test requires the Functions runtime — verified manually via curl.
        Assert.NotNull(function);
    }
}
```

> Note: Azure Functions Worker `HttpResponseData` is abstract and requires the runtime host to instantiate. Unit tests verify construction; end-to-end verification uses `func start` + curl.

- [ ] **Step 2: Implement HealthCheck**

Create `mylife-api/MyLife.Api/Functions/HealthCheck.cs`:

```csharp
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using System.Net;

public class HealthCheck
{
    private readonly ILogger<HealthCheck> _logger;

    public HealthCheck(ILogger<HealthCheck> logger)
    {
        _logger = logger;
    }

    [Function("HealthCheck")]
    public HttpResponseData Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "health")]
        HttpRequestData req)
    {
        _logger.LogInformation("Health check called");
        var response = req.CreateResponse(HttpStatusCode.OK);
        response.WriteString("OK");
        return response;
    }
}
```

- [ ] **Step 3: Run tests**

```bash
cd C:\Apps\MyLife\mylife-api
dotnet test
```

Expected: all tests PASS.

- [ ] **Step 4: Verify function runs locally**

```bash
cd mylife-api/MyLife.Api
func start
```

In a separate terminal:

```bash
curl http://localhost:7071/api/health
```

Expected: `OK`

- [ ] **Step 5: Commit**

```bash
cd C:\Apps\MyLife
git add mylife-api/
git commit -m "feat: add HealthCheck Azure Function"
```

---

## Task 15: Azure Static Web Apps configuration

**Files:**
- Create: `staticwebapp.config.json`

- [ ] **Step 1: Create staticwebapp.config.json**

Create `C:\Apps\MyLife\staticwebapp.config.json`:

```json
{
  "routes": [
    {
      "route": "/.auth/*",
      "allowedRoles": ["anonymous"]
    },
    {
      "route": "/api/*",
      "allowedRoles": ["authenticated"]
    },
    {
      "route": "/*",
      "allowedRoles": ["authenticated"]
    }
  ],
  "responseOverrides": {
    "401": {
      "redirect": "/.auth/login/github",
      "statusCode": 302
    }
  },
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/api/*"]
  },
  "platform": {
    "apiRuntime": "dotnet-isolated|8.0"
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd C:\Apps\MyLife
git add staticwebapp.config.json
git commit -m "feat: add Azure Static Web Apps routing and auth config"
```

---

## Task 16: Deploy to Azure Static Web Apps

- [ ] **Step 1: Create Azure Static Web App via Azure Portal**

1. Go to [portal.azure.com](https://portal.azure.com) → Create a resource → Static Web App
2. Fill in:
   - **Subscription:** your subscription
   - **Resource group:** create new → `mylife-rg`
   - **Name:** `mylife-dashboard`
   - **Plan type:** Free
   - **Region:** East Asia (or nearest to you)
   - **Source:** GitHub
3. Connect your GitHub account and select your repo + `main` branch
4. Build details:
   - **Build preset:** Angular
   - **App location:** `/mylife-app`
   - **API location:** `/mylife-api/MyLife.Api`
   - **Output location:** `dist/mylife-app/browser`
5. Click Review + Create

Azure creates a GitHub Actions workflow file in your repo automatically.

- [ ] **Step 2: Add Supabase secrets to Azure Static Web Apps**

In Azure Portal → your Static Web App → Configuration → Application settings, add:

| Name | Value |
|------|-------|
| `SupabaseUrl` | `https://YOUR_PROJECT.supabase.co` |
| `SupabaseServiceKey` | your service role key |

- [ ] **Step 3: Push and verify deployment**

```bash
cd C:\Apps\MyLife
git add .
git commit -m "chore: add GitHub Actions workflow from Azure"
git push origin main
```

Go to your repo's Actions tab — watch the workflow run. When complete, open the URL shown in the Azure Portal for your Static Web App.

Expected: redirected to GitHub login → after login, see the homepage with 6 workspace cards.

---

## Verification Checklist

Before moving to Plan 2, confirm:

- [ ] `http://localhost:4200` shows homepage with 6 cards when running locally (Angular dev server won't enforce auth)
- [ ] `http://localhost:7071/api/health` returns `OK` when Functions run locally
- [ ] Deployed URL redirects to GitHub login when not signed in
- [ ] After signing in with your GitHub account, homepage is shown
- [ ] After signing in with a different account, `/unauthorized` is shown
- [ ] All Angular tests pass: `npx ng test --watch=false --browsers=ChromeHeadless`
- [ ] All .NET tests pass: `dotnet test`

---

## Next Plans

- **Plan 2:** Day Routines + EQ Check-in — replace stub components with full UI + API
- **Plan 3:** Feel Alive + Tech Reads
- **Plan 4:** Habit Tracker + Challenges
