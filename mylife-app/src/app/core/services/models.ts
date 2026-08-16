/**
 * Every row stored locally has a generated id and creation timestamp, so these
 * are required rather than optional as they were when the server assigned them.
 */
export interface BaseRow {
  id: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface FeelAliveItem extends BaseRow {
  text: string;
  done: boolean;
}

export interface TechTopic extends BaseRow {
  title: string;
  status: 'not_started' | 'in_progress' | 'done';
  progress_pct: number;
}

export interface Habit extends BaseRow {
  name: string;
}

export interface HabitLog extends BaseRow {
  habit_id: string;
  logged_date: string;
}

export interface EqCheckin extends BaseRow {
  emotion: string;
  notes?: unknown;
}

export interface EqSuggestion {
  id: string;
  emotion: string;
  activity_text: string;
}

export interface RoutineTemplate extends BaseRow {
  day_type: 'lazy' | 'reset' | 'creative' | 'focused';
  title: string;
}

/** The four day types, in the order they appear as tiles (REQ-ROUT-01). */
export const DAY_TYPES = [
  { type: 'lazy', label: 'Lazy', emoji: '😴' },
  { type: 'reset', label: 'Reset', emoji: '🔄' },
  { type: 'creative', label: 'Creative', emoji: '🎨' },
  { type: 'focused', label: 'Focused', emoji: '🎯' }
] as const satisfies readonly {
  type: RoutineTemplate['day_type'];
  label: string;
  emoji: string;
}[];

export const DAY_TYPE_TITLES: Record<RoutineTemplate['day_type'], string> = {
  lazy: 'Lazy day',
  reset: 'Reset day',
  creative: 'Creative day',
  focused: 'Focused day'
};

export interface RoutineItem extends BaseRow {
  template_id: string;
  text: string;
  position: number;
}

/** One tick of a routine step on one calendar day. */
export interface RoutineItemLog extends BaseRow {
  item_id: string;
  logged_date: string;
}

export interface Challenge extends BaseRow {
  name: string;
  status: 'upcoming' | 'active' | 'completed' | 'abandoned';
  start_date?: string;
  duration_days?: number;
}

export interface ChallengeRule extends BaseRow {
  challenge_id: string;
  text: string;
  position: number;
}

export interface ChallengeRuleLog extends BaseRow {
  rule_id: string;
  logged_date: string;
}

/** Local date as YYYY-MM-DD, avoiding the UTC shift toISOString() would cause. */
export function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
