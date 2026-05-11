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
