# MyLife Dashboard — Requirements Specification

**Version:** 2.1
**Date:** 16 August 2026
**Live:** https://mahalaxmisk.github.io/mylife-dashboard/
**Supersedes:** `docs/superpowers/specs/2026-05-11-mylife-dashboard-design.md`

---

## 1. Purpose

A private dashboard for the parts of life a task manager can't hold — mood,
energy, self-knowledge, and commitment.

The premise: the hard question usually isn't *what do I need to do*, it's *what
should today look like given how I actually am right now*. A tool you open when
depleted must not feel like another demand.

**Single user. No sharing, no social layer, no streaks used as pressure.**

---

## 2. Current state

| | |
| --- | --- |
| Deployed | GitHub Pages, auto-deploys on push to `master` |
| Frontend | Angular 17, standalone components, hash routing |
| Storage | Browser IndexedDB — **local to one device** |
| Auth | None |
| Sync | None |
| Tests | 21 passing, headless Chrome |
| Owner | A .NET developer learning Angular — relevant to REQ-SEED-05 |

Six modules exist and work. Data never leaves the device it was typed on.

---

## 3. Priorities

| Rank | Item | Status |
| --- | --- | --- |
| **P1** | Cross-device sync with login (§5) | blocked — needs an access token (§5.5) |
| **P2** | Restore missing module behaviour (§6) | in progress — 2 of 9 done |
| **P3** | Starter content and personalisation (§7) | not started |
| P4 | Installable on phone home screen (§8.1) | not started |
| P5 | Cross-module intelligence (§8.2) | not started |
| P6 | Weekly review (§8.3) | not started |

---

## 4. Cross-cutting requirements

**REQ-GEN-01** — Every module is independent. Adding a seventh must not require
touching the other six.

**REQ-GEN-02** — Writes are optimistic: the UI responds immediately and reverts
with a visible message if the write fails. Silent failure is a defect.

**REQ-GEN-03** — The visual language stays calm. Soft beige `#f8f4f0`, cream
`#fff`, warm taupe `#c9b8a8` / `#5a4a3a`. Closer to a notebook than an app.

**REQ-GEN-04** — Usable one-handed on a phone. Tap targets ≥ 44px.

**REQ-GEN-05** — Never shame the user. No "you broke your streak," no red
warnings for missed days, no guilt copy anywhere.

---

## 5. P1 — Sync and login

### 5.1 The problem

Data lives in one browser. Track habits on the laptop for three weeks, open the
phone, see an empty grid. For a habit tracker that removes most of the point.

Syncing requires a server. A server requires a login. The two are one piece of
work, which is why they're one requirement.

### 5.2 Requirements

**REQ-SYNC-01** — Data persists to a hosted database, reachable from any device.

**REQ-SYNC-02** — Access requires email and password. No anonymous access to
any data.

**REQ-SYNC-03** — Sessions persist across browser restarts. Logging in daily
would kill the habit of using this.

**REQ-SYNC-04** — Account creation is disabled after the owner's account exists.
Strangers must not be able to register.

**REQ-SYNC-05** — Access control is enforced **by the database**, not by
application code. A row is readable only by the user who created it, checked at
the database level on every query.

*Rationale: the site is public and the client key ships inside the JavaScript.
Anyone can read that key and query the database directly. Database-level rules
mean they get an empty result. Application-level checks would not survive this.*

**REQ-SYNC-06** — Data already in a browser from the local-only version must be
uploadable to the account, with foreign keys remapped to the ids the database
assigns. One-time, user-initiated.

**REQ-SYNC-07** — Export to JSON remains available, so the user is never locked
in and always holds a copy.

**REQ-SYNC-08** — Signing out clears the local session but must not delete
remote data.

### 5.3 Explicit trade-offs

- **Offline stops working.** The app becomes network-dependent. Accepted for
  now; §8.1 revisits it.
- **Privacy weakens.** Check-ins move from your device to a hosting provider's
  servers. Encrypted in transit and at rest, invisible to other users, but the
  provider technically holds the keys. This is strictly less private than local
  storage. See REQ-FUT-04.
- **Free tiers pause.** Hosted databases on free plans typically pause after
  inactivity and need a click to wake.

### 5.4 Design decided so far

- 11 tables, each with a `user_id` defaulting to the authenticated user
- Row-level security policy per table: `user_id = auth.uid()`
- A `routine_item_logs` table, which the old schema lacked — this is why
  routine ticks currently vanish on reload (REQ-ROUT-03)
- EQ suggestions bundled into the build rather than stored per-user; they are
  identical for everyone and need no table
- Login screen, route guard, sign-out, and a migration path for local data

### 5.5 Setup this requires

The owner wants no manual console work. All of it can be driven through the
provider's management API instead, so the whole of this reduces to one hand-off:

1. The owner generates a **personal access token** in the provider dashboard and
   supplies it once. This is the only step that cannot be automated — issuing a
   credential is the owner's to do.
2. Everything after that is scripted: create the project, apply the schema and
   row-level security policies, create the owner's user, disable new signups,
   and write the publishable key into the environment files.

**REQ-SYNC-09** — Setting up sync must not require the owner to click through a
database console. Given a token, the rest is automated.

*Open question on REQ-SYNC-02: creating the account means setting a password,
which the assistant should not do. A magic-link (email one-time code) login
satisfies "no anonymous access" without anyone handling a password, and is
easier on a phone. Decide before building the login screen.*

---

## 6. P2 — Restore missing module behaviour

The original design had more character than what shipped. These are gaps
against that design, not new ideas.

### 6.1 Day Routines

**REQ-ROUT-01** — Present four day-type tiles: Lazy 😴, Reset 🔄, Creative 🎨,
Focused 🎯. Selecting one loads its template below. *Done.*

**REQ-ROUT-02** — Template steps are reorderable, not just add/delete. *Done —
up/down buttons rather than drag, so the control stays keyboard-reachable and
usable one-handed.*

**REQ-ROUT-03** — Ticked steps persist per calendar day. *Done.*

### 6.2 EQ Check-in

**REQ-EQ-01** — Three steps: **Name it → Explore → Suggestions**. *Done.*

**REQ-EQ-02** — Explore asks 2–3 reflective questions one at a time — "When did
this start?", "What's underneath this?" — with optional free-text answers,
stored keyed by question. *Done — skipping any question is fine, and Back
returns the previous answer to its box.*

**REQ-EQ-03** — Custom emotions can be typed, not only chosen from the preset
list. *Done — a typed emotion with no suggestions of its own falls back to a
general set rather than being a dead end.*

**REQ-EQ-04** — Suggestions are drawn from the selected emotion; three shown.
*Done.*

*Why this matters: without Explore, the module is a lookup table. The pause
between naming a feeling and being handed advice is the part that does the
work.*

### 6.3 Feel Alive

**REQ-ALIVE-01** — A spin wheel (animated CSS conic-gradient) lands on a random
item. *Done — it offers what is not done yet, falling back to everything once
all of it is. Honours prefers-reduced-motion.*

**REQ-ALIVE-02** — A plain "Pick random" button as the simpler alternative.
*Done.*

### 6.4 Tech Reads

**REQ-TECH-01** — "Pick random" selects among not-started and in-progress
topics. *Done.*

**REQ-TECH-02** — Status shown as a dot whose weight reflects progress. *Done —
a filled dot that gains weight with progress, hollow once finished.*

### 6.5 Habits

**REQ-HABIT-01** — Today's list leads, with tap-to-complete and per-habit
streak. The weekly grid sits **below** it. *Done — the count beside Today is a
count, not a target, so there is nothing to fall short of.*

**REQ-HABIT-02** — Streaks count consecutive days across all history, and stay
alive when today is not yet ticked but yesterday was. *Done.*

### 6.6 Challenges

**REQ-CHAL-01** — The active challenge expands by default showing "Day N of M"
and today's checklist. *Done.*

**REQ-CHAL-02** — Completed and abandoned challenges collapse to the bottom.
*Done — behind a collapsed "Finished" disclosure.*

**REQ-CHAL-03** — Missed rules are recorded but never end a challenge. *Done —
a missed day is recorded by the absence of a row, nothing changes status on the
user's behalf, and a challenge that runs past its last day keeps running.*

### 6.7 Home

**REQ-HOME-01** — Use the emoji icons from the original design, not abstract
glyphs. *Done — Habits takes a seedling rather than the usual flame, since a
streak counter is already enough pressure (REQ-GEN-05).*

**REQ-HOME-02** — Card subtitles must describe what the module actually does.
*Done — the EQ card said "Name it · Explore · Act" when there was neither an
Explore step nor an Act step. Both now match what the modules do, and Feel
Alive can honestly mention the wheel because it exists.*

---

## 7. P3 — Starter content and personalisation

An empty module gives no clue what belongs in it, and "add your first habit" is
a demand at the moment the user is least able to meet one. Every module should
arrive holding something worth keeping, drawn from real published guidance and
tuned to this user rather than generic filler.

**REQ-SEED-01** — Each of the four day types arrives with a real routine the
first time it is opened — an ordered set of steps grounded in published guidance
on rest, reset, creative and focused days, not placeholder text.

**REQ-SEED-02** — Seeded rows are ordinary user data. They can be edited,
reordered and deleted exactly like hand-typed ones.

**REQ-SEED-03** — Seeding happens per module, on first use of that module, and
never again. A module the user has deliberately emptied stays empty — content
must not reappear on the next visit.

**REQ-SEED-04** — The EQ emotion list widens well beyond the current ten, and
each emotion carries enough suggestions that a third visit does not simply
repeat the first.

**REQ-SEED-05** — Tech Reads is seeded for this user's actual stack, .NET and
Angular, rather than a generic engineering reading list. The user is a .NET
developer learning Angular, and the module is worthless if it ignores that.

**REQ-SEED-06** — Feel Alive, Habits and Challenges arrive with starters framed
as examples rather than prescriptions, consistent with REQ-GEN-05.

**REQ-SEED-07** — Seed content is bundled into the build, not fetched at
runtime. It must survive with no network and add no startup request.

**REQ-SEED-08** — Sources for the routine and emotion content are recorded, so
the claims behind them can be checked later rather than taken on trust.

---

## 8. Later

**REQ-FUT-01 — Installable.** Web manifest and service worker, so it launches
from the phone home screen and works offline. Likely the single biggest factor
in whether this becomes a daily habit rather than a site to remember.

**REQ-FUT-02 — Cross-module intelligence.** The six modules are currently
strangers. An EQ check-in of *overwhelmed* could offer the Reset Day routine. A
collapsing habit could surface during a check-in. The data is already being
collected; nothing reads across it.

**REQ-FUT-03 — Weekly review.** Six modules generate real signal — moods,
streaks, progress, abandoned challenges. None of it is ever reflected back.

**REQ-FUT-04 — Client-side encryption.** Encrypt note content before it leaves
the device, so the hosting provider stores ciphertext it cannot read. Restores
the privacy given up in §5.3. Cost: a lost passphrase means unrecoverable data.

---

## 9. Out of scope

- Multi-user, sharing, collaboration
- Notifications or reminders — this is a place you choose to go
- Analytics or tracking of any kind
- Native mobile apps (REQ-FUT-01 covers the need)
- AI-generated advice; suggestions stay a fixed, reviewable list

---

## 10. Non-functional

**REQ-NFR-01** — Hosting stays free.
**REQ-NFR-02** — Interactive within 2s on a mid-range phone over 4G.
**REQ-NFR-03** — Every action reachable by keyboard; inputs properly labelled.
**REQ-NFR-04** — The user can export everything at any time.
**REQ-NFR-05** — Dates handled in local time. A day ends at the user's midnight,
not UTC.

---

## 11. Known defects

| ID | Issue | Status |
| --- | --- | --- |
| BUG-01 | Auth guard compared an email against a GitHub username, locking out the owner | fixed |
| BUG-02 | API access control was frontend-only and bypassable | fixed by removal; REQ-SYNC-05 replaces it |
| BUG-03 | EQ emotion buttons did not match the suggestion data, so no suggestion ever appeared | fixed |
| BUG-04 | Habit streaks capped at 7 by the visible window | fixed |
| BUG-05 | Error toasts existed but were never triggered | fixed |
| BUG-06 | Dead `api.service.ts` / `auth.service.ts` left in the repo after a zip-over-extract | fixed |
| BUG-07 | Routine ticks lost on reload | fixed |
| BUG-08 | Home advertises a spin wheel that does not exist | fixed — the wheel now exists |

---

## 12. Verification status

Verified: storage logic against a real IndexedDB implementation (CRUD, cascade
deletes, streak edge cases, export/import round trip); production build from a
clean clone; built output served over HTTP.

**The unit tests now run** — 21 passing against headless Chrome, up from the 7
that had never once been executed. Routine ticks were additionally confirmed by
hand in a browser: ticked, reloaded, still ticked.

The IndexedDB v1 → v2 upgrade was verified against a genuine v1 database seeded
with a row: the row survived and the new store appeared. This matters because
the owner has real history in v1 databases on more than one device.

Still not verified: the six data services other than routines have no tests at
all, and most of the assembled UI has never been clicked through.
