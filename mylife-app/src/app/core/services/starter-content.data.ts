import { RoutineTemplate } from './models';

/**
 * Starter content, bundled with the build (REQ-SEED-07).
 *
 * An empty module gives no clue what belongs in it, and "add your first habit"
 * is a demand at the moment the user is least able to meet one. Each module is
 * offered this once, on first use, and never again -- see SeedService. Every
 * row is ordinary user data once written: editable, reorderable and deletable
 * like anything typed by hand (REQ-SEED-02).
 */

/**
 * REQ-SEED-01: a real day for each type, not placeholder text.
 *
 * The four are deliberately different days rather than one day in four moods.
 * Lazy is short on purpose -- a ten-item checklist on the day meant for someone
 * with nothing left is a contradiction. Creative is input and play, with no
 * blocks and nothing to ship, which is what separates it from Focused.
 */
export const STARTER_ROUTINES: Record<RoutineTemplate['day_type'], string[]> = {
  lazy: [
    "Leave the alarm off",
    "Let the daylight in",
    "Drink water, eat something",
    "Close the laptop lid",
    "Nap or read",
    "Let today be enough",
  ],
  reset: [
    "Start the day from now",
    "Find daylight after waking",
    "Write down what is unfinished",
    "Fill one bag with rubbish",
    "Clear one small surface",
    "Restart one habit, smallest version",
    "Pick three things for tomorrow",
    "Set tomorrow's wake time",
    "Call the day done early",
  ],
  creative: [
    "Read something outside your field",
    "Copy something you like",
    "Set one arbitrary rule",
    "Make something with no use",
    "Do something dull on purpose",
    "Put it down unfinished",
    "Keep the offcuts in one place",
    "Notice what you kept returning to",
  ],
  focused: [
    "Name today's one hard thing",
    "Block ninety minutes for it",
    "Put the phone in another room",
    "Close every tab but one",
    "Note stray thoughts on paper",
    "Step outside for ten minutes",
    "Cap the day at two blocks",
    "Leave email for the afternoon dip",
    "Write down tomorrow's first step",
    "Say the workday is closed",
  ]
};

/** REQ-SEED-06: examples, not prescriptions. */
export const STARTER_FEEL_ALIVE: string[] = [
  "Walk fifteen minutes looking up",
  "Find the biggest tree nearby",
  "Sit in the park till dusk",
  "Open a window and listen",
  "Take the long way home",
  "Walk a street you don't know",
  "Leave the phone in another room",
  "Play one album straight through",
  "Dance to three whole songs",
  "Cook something new tonight",
  "Sketch the thing nearest you",
  "Fold one paper crane",
  "Water your plants slowly",
  "Ask a shopkeeper one question",
  "Do a chore that isn't yours",
  "Finish your shower cold",
  "Reread messages you kept",
  "Find three stars from outside",
  "Eat one meal without screens",
  "Name three birds you see",
];

export interface StarterHabit {
  name: string;
  /** The cue that triggers it -- the habit design, not decoration. */
  cue: string;
}

export const STARTER_HABITS: StarterHabit[] = [
  { name: "Drink a glass of water", cue: "after you sit down at your desk; one glass, then carry on" },
  { name: "Stretch while the kettle boils", cue: "the moment you switch the kettle on; standing up and reaching counts, any short wait works" },
  { name: "Step outside for five minutes", cue: "after the morning coffee; the doorstep counts, the front step is enough" },
  { name: "Walk after lunch", cue: "after you put the plate down; same short loop every day" },
  { name: "Open the Angular project", cue: "after you close work email; opening it counts as done, ten minutes if it flows" },
  { name: "Read one page", cue: "after the phone goes on the shelf; any book, one page is the whole habit" },
  { name: "Write tomorrow's first task", cue: "before you close the laptop; one line, no plan needed" },
  { name: "Note one thing that went well", cue: "after you shut the laptop; one short line, no analysis" },
  { name: "Clear one surface", cue: "after dinner; pick the same surface each time" },
  { name: "Wash the dishes before bed", cue: "after the last plate goes down; a clear sink is enough" },
  { name: "Lay out tomorrow's clothes", cue: "after brushing teeth; laid out counts, folded does not matter" },
  { name: "Charge the phone outside the bedroom", cue: "when the lights go low; the hall socket is the spot" },
];

export interface StarterTechRead {
  title: string;
  note: string;
}

/**
 * REQ-SEED-05: this user's stack. A .NET developer learning Angular, on an
 * Angular 17 codebase, so items needing a newer Angular say which in the note.
 */
export const STARTER_TECH_READS: StarterTechRead[] = [
  { title: "Read the Angular signals guide", note: "signal, computed and effect are already stable in 17.3, so this is the one piece of modern Angular you can learn without upgrading first. One careful pass through the guide replaces a lot of guessing later." },
  { title: "Replace one effect with computed", note: "Using effect() to set another signal is the common early mistake, and it invites loops and odd ordering. Find one place where the value is really derived and move it to computed(); linkedSignal covers the writable case once the upgrade passes v19." },
  { title: "Bridge RxJS with toSignal", note: "toSignal() reads an Observable straight into a template, toObservable() goes the other way when you want operators like debounceTime. Both ship in 17.3, and ApiService returns Observables today, so this is doable before any upgrade." },
  { title: "Try httpResource after the upgrade", note: "resource(), rxResource() and httpResource() went stable in v22 and cover the loading, error and reload states you would otherwise hand-roll. They do not exist in 17.3, so this one sits behind the upgrade rather than beside it." },
  { title: "Plan the v17 to v22 upgrade", note: "17.3 to 22 is five majors, one ng update at a time with the schematics run after each. The official update guide generates the step list; writing it down first turns a big jump into a checklist." },
  { title: "Read up on the OnPush default", note: "Angular 22 makes OnPush the default for any component that does not set changeDetection, with ChangeDetectionStrategy.Eager as the way back out. No component in the app sets it today, so this is the behaviour change most likely to surprise you mid-upgrade." },
  { title: "Read the zoneless migration guide", note: "provideZonelessChangeDetection went stable in v20.2 and v21 dropped zone.js from new projects; 17.3 still carries it. Reading the guide now mostly tells you which patterns to stop writing, so the eventual switch is a smaller one." },
  { title: "Wrap a heavy view in defer", note: "@defer loads a chunk of template on idle, on viewport or on interaction, and it is stable in 17.3 already. The spin wheel and the weekly habit grid are the two obvious candidates." },
  { title: "Plan the Karma to Vitest move", note: "Karma is deprecated, Vitest is the default runner from v21, and v22 ships a migrate-karma-to-vitest schematic. The existing spec files are fine until the upgrade reaches v21, so this belongs in the upgrade plan rather than in today." },
  { title: "Drop the unused animations package", note: "@angular/animations is deprecated as of v20.2 and is scheduled for removal in v23. It sits in package.json but nothing under src imports it, so this is a one-line delete rather than a migration." },
  { title: "Move the API to .NET 10", note: "MyLife.Api targets net8.0, and .NET 8 and .NET 9 both lose support on 10 November 2026. .NET 10 is LTS until November 2028, so the usual advice is to skip 9 and go straight there." },
  { title: "Check Flex Consumption before upgrading", note: "The project already uses the isolated worker model, so the in-process retirement does not apply here. What does apply: .NET 10 is supported on every hosting plan except Linux Consumption, and Flex Consumption is the intended landing spot." },
  { title: "Add a JsonSerializerContext", note: "SupabaseService calls JsonSerializer with reflection on every request. Source generation moves that work to compile time, which trims cold start on a Functions app and is a prerequisite if trimming or AOT ever interests you." },
  { title: "Audit async void and cancellation", note: "SupabaseService accepts no CancellationToken and passes none to HttpClient, so an abandoned request still runs to completion. async void outside an event handler swallows exceptions in the same quiet way; both are findable by reading your own handlers once." },
  { title: "Add resilience to one HttpClient", note: "AddHttpClient<ISupabaseService, SupabaseService> has no retry or timeout today, so one Supabase blip surfaces as a 500. Microsoft.Extensions.Http.Resilience, built on Polly v8, adds retry, timeout and circuit breaker in a few lines of DI. The older Http.Polly package is retired, which is why most blog posts look wrong." },
  { title: "Trim one Supabase select", note: "GetAsync takes a raw query string, so nothing stops a call pulling every column of every row. PostgREST gives you select= for columns, order= for sorting and Range headers for paging; choosing them deliberately on one list call is the whole lesson." },
  { title: "Add an ETag to one endpoint", note: "Returning an ETag and answering If-None-Match with a 304 skips the response body when nothing changed. It is small, durable HTTP knowledge that outlives whichever framework you are using." },
  { title: "Walk through PKCE once", note: "Authorization code with PKCE is the only browser flow OAuth 2.1 keeps; implicit is gone. Static Web Apps runs this on your behalf, so tracing the redirects and the code_verifier by hand once is really about seeing what the auth guard is trusting." },
  { title: "Design one composite index", note: "A B-tree index on (A, B) is most useful when the query constrains the leading column; Postgres 18 skip scan softens that rule without removing it. habit_logs already has UNIQUE (habit_id, logged_date), so the exercise is working out what an eq_checkins by date query would want." },
  { title: "Check the service key boundary", note: "SupabaseServiceKey lives in Functions config and grants full table access, bypassing row level security. Reading the key doc once keeps the split between the browser, /api and Supabase a decision rather than an accident." },
];

export interface StarterChallenge {
  name: string;
  durationDays: number;
  /** Each one tickable at the end of a day (REQ-SEED-13). */
  rules: string[];
  /** Allowances that are not daily rules -- what stops this becoming a stick. */
  note: string;
}

/**
 * Seeded as 'upcoming', never 'active'. Arriving to six challenges already
 * running would be six commitments nobody made (REQ-SEED-06).
 */
export const STARTER_CHALLENGES: StarterChallenge[] = [
  {
    name: "Phone-free nights",
    durationDays: 7,
    rules: [
      "Charge the phone out of reach",
      "Set the alarm before bed",
      "Leave something to read nearby",
    ],
    note: "Miss a night, pick it up the next. Out of reach means anything that needs standing up, so any corner of any room works. Anything to read counts, including the docs you meant to finish."
  },
  {
    name: "Small code daily",
    durationDays: 14,
    rules: [
      "Open the Angular project",
      "Make one change that builds",
      "Commit whatever you have",
    ],
    note: "Ten minutes counts as a full day. On a flat day, opening the project and reading one file still counts."
  },
  {
    name: "Clear surfaces",
    durationDays: 10,
    rules: [
      "Set a ten minute timer",
      "Clear one surface",
      "Stop when the timer ends",
    ],
    note: "One surface at a time, and whatever is left waits for tomorrow. Bin it, put it away, or box it for donation, and skip the maybe pile."
  },
  {
    name: "Daylight before noon",
    durationDays: 30,
    rules: [
      "Step outside before noon",
      "Keep to the same route",
      "Stay out ten minutes",
    ],
    note: "Cloud and drizzle still count. The same route every day means there is nothing to decide. On a heavy day, ten minutes just outside the door counts as the route."
  },
  {
    name: "Study notes",
    durationDays: 10,
    rules: [
      "Write one idea from today",
      "Add one snippet or link",
      "Keep it to three lines",
    ],
    note: "All of it goes in one file, so there is nothing to organise. Put the idea in your own words rather than copying it. On a day with no new idea, write down the thing you got stuck on."
  },
  {
    name: "Without the feed",
    durationDays: 30,
    rules: [
      "Keep feed apps off the phone",
      "Start the day without scrolling",
      "Close the feed after one look",
    ],
    note: "Feed apps means the ones with an endless scroll, whichever those are for you. If one opens out of habit, close it and carry on; the day still counts."
  },
];
