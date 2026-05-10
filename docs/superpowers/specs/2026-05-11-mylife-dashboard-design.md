# MyLife Dashboard — Design Spec
**Date:** 2026-05-11  
**Stack:** Angular + .NET Azure Functions + Supabase PostgreSQL  
**Deployment:** Azure Static Web Apps (free tier)  
**Auth:** Azure Static Web Apps built-in OAuth (GitHub or Google, locked to owner account)

---

## Overview

A personal, single-user web dashboard accessible from any device. Protected by OAuth — only the owner can log in. A homepage displays workspace cards; each card navigates to an independent "space" (mini-app). New spaces can be added in the future without touching existing ones.

---

## Architecture

```
Browser (Angular SPA)
    │
    ├── Azure Static Web Apps
    │       ├── Hosts Angular build (free tier)
    │       ├── Built-in Auth (GitHub/Google OAuth)
    │       ├── staticwebapp.config.json locks access to owner account
    │       └── Unauthenticated requests → /.auth/login/{provider}
    │
    ├── Azure Functions (.NET 8 Isolated Worker, v4)
    │       ├── /api/routines/*
    │       ├── /api/eq/*
    │       ├── /api/feel-alive/*
    │       ├── /api/tech-reads/*
    │       ├── /api/habits/*
    │       └── /api/challenges/*
    │
    └── Supabase (PostgreSQL, free tier)
            ├── routines_templates
            ├── routines_items
            ├── eq_checkins
            ├── eq_suggestions
            ├── feel_alive_items
            ├── tech_topics
            ├── habits
            ├── habit_logs
            ├── challenges
            ├── challenge_rules
            └── challenge_rule_logs
```

**Angular structure:**
- `CoreModule` — HttpClient, auth guard, base API service, toast notification service
- `HomeModule` — homepage with workspace card grid
- `RoutinesModule` — lazy-loaded
- `EqModule` — lazy-loaded
- `FeelAliveModule` — lazy-loaded
- `TechReadsModule` — lazy-loaded
- `HabitsModule` — lazy-loaded
- `ChallengesModule` — lazy-loaded

**Auth flow:**
1. Azure Static Web Apps intercepts all routes
2. Unauthenticated users redirected to `/.auth/login/github` (or google)
3. `staticwebapp.config.json` allows only the owner's specific user ID/email via `allowedRoles`
4. All other authenticated users receive 401
5. Angular reads `/.auth/me` to display the owner's name in the header

**Data flow:**
Angular services → HTTP calls to `/api/*` Azure Functions → Supabase REST API (via `HttpClient` with service role key header). No Supabase SDK needed in .NET.

---

## Homepage

- Calm & minimal aesthetic: soft beige (`#f8f4f0`), cream white (`#fff`), warm taupe accents (`#c9b8a8`, `#5a4a3a`)
- Greeting: "Good morning ✦" with current date and owner name (from `/.auth/me`)
- 2×3 card grid (6 spaces), each card shows: emoji icon, space name, short subtitle
- Cards navigate to their respective lazy-loaded routes

---

## Space Designs

### 1. Day Routines (`/routines`)

**Purpose:** Pick a day type and see a template of what to spend the day on.

**UI flow:**
1. Four day-type tiles: Lazy Day 😴, Reset Day 🔄, Creative Day 🎨, Focused Day 🎯
2. Selecting a tile loads that day type's template items below
3. Template items are an ordered list (position-based)
4. Owner can edit template items (add, reorder, delete) in an edit mode

**API endpoints:**
- `GET /api/routines/templates` — all 4 templates with their items
- `PUT /api/routines/templates/{dayType}/items` — save updated item list

---

### 2. EQ Check-in (`/eq`)

**Purpose:** Name your current emotion, answer reflective questions, receive activity suggestions.

**UI flow:**
1. **Step 1 — Name it:** Pill-style emotion tags (anxious, overwhelmed, hopeful, numb, angry, grateful, etc.) — tap to select, or type a custom one
2. **Step 2 — Explore:** 2–3 reflective questions shown one at a time (e.g. "When did this start?", "What's underneath this feeling?") — free text answers, optional
3. **Step 3 — Suggestions:** 3 activity suggestions surfaced based on selected emotion (from seeded `eq_suggestions` table)
4. Check-in is saved to `eq_checkins` for history (future feature)

**API endpoints:**
- `GET /api/eq/suggestions/{emotion}` — returns 3 activity suggestions for the emotion
- `POST /api/eq/checkins` — saves a check-in record

**Seed data:** `eq_suggestions` is populated once via a SQL seed script (committed to the repo under `db/seeds/eq_suggestions.sql`) covering ~10 common emotions with 3 activities each. Owner can add rows directly in Supabase dashboard.

---

### 3. Feel Alive (`/feel-alive`)

**Purpose:** A curated list of things that make you feel alive, independent, and confident — with a random picker.

**UI flow:**
- Spin wheel (CSS conic-gradient, animated rotation) → lands on a random item
- Alternatively, "Pick random" button for simplicity
- Below the wheel: the full list with ability to add new items and mark items as done
- Done items shown with strikethrough, can be un-done

**API endpoints:**
- `GET /api/feel-alive` — all items
- `POST /api/feel-alive` — add item
- `PATCH /api/feel-alive/{id}` — toggle done / update text
- `DELETE /api/feel-alive/{id}` — remove item

---

### 4. Tech Reads (`/tech-reads`)

**Purpose:** Maintain a reading list of technical topics with progress tracking and a random picker.

**UI flow:**
- "Pick random" button selects a random not-started or in-progress topic and highlights it
- Topic list with status indicator dot: not started (light), in progress (medium), done (dark)
- Clicking a topic opens an inline detail: update status, set progress percentage (0–100)
- "Add topic" button at the top

**Status values:** `not_started` | `in_progress` | `done`

**API endpoints:**
- `GET /api/tech-reads` — all topics
- `POST /api/tech-reads` — add topic
- `PATCH /api/tech-reads/{id}` — update status/progress
- `DELETE /api/tech-reads/{id}` — remove topic

---

### 5. Habit Tracker (`/habits`)

**Purpose:** Track daily habits with streak counting and a weekly completion view.

**UI flow:**
- Today's date shown in header
- List of habits, each with a circle tap-to-complete button, habit name, and current streak (🔥 N day streak)
- Completing a habit fills the circle and strikes through the name
- Weekly grid below: 7 columns (Mon–Sun), one row per habit — filled = all done that day, faded = partial, empty = missed
- "Add habit" at the bottom of the list
- Streak resets to 0 if a habit is not checked on a given calendar day

**API endpoints:**
- `GET /api/habits` — all habits with today's completion status and current streak
- `POST /api/habits` — add habit
- `POST /api/habits/{id}/log` — mark habit done for today (idempotent)
- `DELETE /api/habits/{id}/log/today` — unmark today's completion
- `DELETE /api/habits/{id}` — remove habit
- `GET /api/habits/week` — completion grid data for current week

**Streak logic (server-side):** Streak = count of consecutive calendar days (ending yesterday or today) where the habit was logged. Computed in the Function on each `GET /api/habits` call from `habit_logs`.

---

### 6. Challenges (`/challenges`)

**Purpose:** Define personal challenges with structured rules, track rule compliance daily, and monitor active vs upcoming challenges.

**UI flow:**
- Challenge list showing status badge: Active / Upcoming / Completed / Abandoned
- Active challenge expanded by default: shows "Day N of M", today's rule checklist
- Each rule is a checkbox — tick it off daily; unchecked rules don't break the challenge but are tracked
- Tapping an upcoming challenge expands it to show its rules (read-only until it starts)
- "New challenge" button: enter name, optional duration (days), add rules as a structured list
- Completed/Abandoned challenges shown collapsed at the bottom

**API endpoints:**
- `GET /api/challenges` — all challenges with their rules and today's rule log
- `POST /api/challenges` — create challenge (name, start_date, duration_days, rules array)
- `PATCH /api/challenges/{id}` — update status (complete / abandon)
- `POST /api/challenges/{id}/rules/{ruleId}/log` — tick a rule for today (idempotent)
- `DELETE /api/challenges/{id}/rules/{ruleId}/log/today` — untick today

---

## Data Models (Supabase PostgreSQL)

```sql
-- Day Routines
CREATE TABLE routines_templates (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_type   text NOT NULL CHECK (day_type IN ('lazy','reset','creative','focused')),
  title      text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE routines_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES routines_templates(id) ON DELETE CASCADE,
  text        text NOT NULL,
  position    int NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- EQ Check-in
CREATE TABLE eq_checkins (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emotion   text NOT NULL,
  notes     jsonb,          -- keyed by question text, value = answer
  created_at timestamptz DEFAULT now()
);

CREATE TABLE eq_suggestions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emotion      text NOT NULL,
  activity_text text NOT NULL
);

-- Feel Alive
CREATE TABLE feel_alive_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text       text NOT NULL,
  done       boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Tech Reads
CREATE TABLE tech_topics (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  status       text NOT NULL DEFAULT 'not_started'
                 CHECK (status IN ('not_started','in_progress','done')),
  progress_pct int DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  created_at   timestamptz DEFAULT now()
);

-- Habit Tracker
CREATE TABLE habits (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE habit_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id   uuid REFERENCES habits(id) ON DELETE CASCADE,
  logged_date date NOT NULL,
  UNIQUE (habit_id, logged_date)
);

-- Challenges
CREATE TABLE challenges (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  status         text NOT NULL DEFAULT 'upcoming'
                   CHECK (status IN ('upcoming','active','completed','abandoned')),
  start_date     date,
  duration_days  int,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE challenge_rules (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE,
  text         text NOT NULL,
  position     int NOT NULL
);

CREATE TABLE challenge_rule_logs (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id   uuid REFERENCES challenge_rules(id) ON DELETE CASCADE,
  logged_date date NOT NULL,
  UNIQUE (rule_id, logged_date)
);
```

No user ID columns — single-user app, access enforced at the Azure Static Web Apps routing layer before any request reaches the API.

---

## Error Handling

- **Angular `HttpInterceptor`** — catches all failed API responses, shows a subtle toast notification; no full-page error states
- **Azure Functions** — return standard HTTP codes: 200/201 success, 400 bad input, 500 unexpected, 503 if Supabase unreachable
- **Auth failure** — Azure Static Web Apps returns 401 before the request reaches any Function code; Angular shows a "Sign in" screen

---

## Testing

- **Angular:** Jasmine/Karma unit tests for services (HttpClient mocked) and component logic — included with Angular CLI
- **.NET Functions:** xUnit tests per Function class; Supabase HTTP calls behind an interface, mocked in tests
- **Manual testing** for UI flows — no e2e tests needed for a personal app

---

## Extensibility

Each space is an independent Angular feature module and an independent set of Azure Function endpoints. Adding a new space in the future means:
1. Create a new Angular feature module and add its route to `app-routing.module.ts`
2. Add a new set of Function endpoints under `/api/<new-space>/`
3. Add the required Supabase tables
4. Add a card to the homepage grid

No existing code needs to change.

---

## Visual Style

- **Palette:** `#f8f4f0` (page bg), `#fff` (card bg), `#5a4a3a` (primary text), `#c9b8a8` (accent/selected), `#b0a090` (secondary text), `#ede8e2` (borders)
- **Typography:** Light weight for headings, regular for body, small caps labels
- **Layout:** Generous whitespace, soft border-radius (8–12px), no harsh shadows
- **Mobile-first:** Card grid stacks to single column on small screens
