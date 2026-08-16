-- MyLife dashboard — Postgres schema for Supabase.
--
-- REQ-SYNC-05 is the load-bearing requirement here: access control is enforced
-- by the database, not by application code. The site is public and the
-- publishable key ships inside the JavaScript, so anyone can read that key and
-- query this database directly. Row-level security is what makes them get an
-- empty result instead of someone else's check-ins.
--
-- Every table therefore:
--   * carries user_id, defaulting to auth.uid()
--   * has RLS enabled
--   * has a policy restricting every operation to rows the caller owns
--
-- Ids are assigned by the database (REQ-SYNC-06 remaps local ids on upload).
-- The log tables use a unique constraint rather than a derived id to stay
-- idempotent, so a repeated tick is a no-op at the database level.

-- ---------------------------------------------------------------- routines --

create table if not exists routines_templates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day_type    text not null check (day_type in ('lazy', 'reset', 'creative', 'focused')),
  title       text not null,
  created_at  timestamptz not null default now(),
  -- The four day types are the interface, so there is nowhere to put a second
  -- template of the same type and nothing that would open it (REQ-ROUT-01).
  unique (user_id, day_type)
);

create table if not exists routines_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  template_id  uuid not null references routines_templates (id) on delete cascade,
  text         text not null,
  position     integer not null default 0,
  created_at   timestamptz not null default now()
);

create table if not exists routine_item_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id      uuid not null references routines_items (id) on delete cascade,
  logged_date  date not null,
  created_at   timestamptz not null default now(),
  -- Ticking twice on one day is a no-op rather than a duplicate row.
  unique (user_id, item_id, logged_date)
);

-- --------------------------------------------------------------------- eq --

-- Suggestions and explore questions are bundled into the build, not stored:
-- they are identical for everyone and need no table (REQ-SEED-07).

create table if not exists eq_checkins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  emotion     text not null,
  -- Explore answers, keyed by the question that prompted them (REQ-EQ-02).
  notes       jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------- feel alive --

create table if not exists feel_alive_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  text        text not null,
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------- tech reads --

create table if not exists tech_topics (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title         text not null,
  status        text not null default 'not_started'
                  check (status in ('not_started', 'in_progress', 'done')),
  progress_pct  integer not null default 0 check (progress_pct between 0 and 100),
  -- Why this is worth the time.
  note          text,
  created_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------- habits --

create table if not exists habits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null,
  -- The cue that triggers it. This is the habit design, not decoration.
  note        text,
  created_at  timestamptz not null default now()
);

create table if not exists habit_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  habit_id     uuid not null references habits (id) on delete cascade,
  logged_date  date not null,
  created_at   timestamptz not null default now(),
  unique (user_id, habit_id, logged_date)
);

-- ------------------------------------------------------------- challenges --

create table if not exists challenges (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name           text not null,
  status         text not null default 'upcoming'
                   check (status in ('upcoming', 'active', 'completed', 'abandoned')),
  start_date     date,
  duration_days  integer check (duration_days is null or duration_days > 0),
  -- Allowances that are not daily rules: the part that stops a challenge
  -- becoming a stick (REQ-CHAL-03, REQ-SEED-13).
  note           text,
  created_at     timestamptz not null default now()
);

create table if not exists challenge_rules (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  challenge_id  uuid not null references challenges (id) on delete cascade,
  text          text not null,
  position      integer not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists challenge_rule_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  rule_id      uuid not null references challenge_rules (id) on delete cascade,
  logged_date  date not null,
  created_at   timestamptz not null default now(),
  unique (user_id, rule_id, logged_date)
);

-- --------------------------------------------------------------- app meta --

-- Which modules have already been offered their starter content. Stored per
-- user rather than per device so that signing in on a second device does not
-- look like a fresh install and seed a duplicate set (REQ-SEED-03).
create table if not exists app_meta (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  key         text not null,
  seeded_at   timestamptz not null default now(),
  unique (user_id, key)
);

-- ------------------------------------------------------------------ index --

create index if not exists routines_items_template_idx    on routines_items (user_id, template_id, position);
create index if not exists routine_item_logs_date_idx     on routine_item_logs (user_id, logged_date);
create index if not exists eq_checkins_created_idx        on eq_checkins (user_id, created_at desc);
create index if not exists habit_logs_date_idx            on habit_logs (user_id, logged_date);
create index if not exists challenge_rules_challenge_idx  on challenge_rules (user_id, challenge_id, position);
create index if not exists challenge_rule_logs_date_idx   on challenge_rule_logs (user_id, logged_date);

-- -------------------------------------------------------------------- rls --

-- One policy per table, covering every operation. `using` filters what can be
-- read, updated or deleted; `with check` stops a row being written under
-- somebody else's user_id.
do $$
declare
  t text;
begin
  foreach t in array array[
    'routines_templates', 'routines_items', 'routine_item_logs',
    'eq_checkins', 'feel_alive_items', 'tech_topics',
    'habits', 'habit_logs',
    'challenges', 'challenge_rules', 'challenge_rule_logs',
    'app_meta'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists owner_only on public.%I', t);
    execute format(
      'create policy owner_only on public.%I
         for all
         to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- Anonymous callers get nothing. Spelled out rather than assumed, because the
-- publishable key that reaches this database is public by design.
revoke all on all tables in schema public from anon;
