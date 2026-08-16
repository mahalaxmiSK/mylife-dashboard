import { ExploreQuestion } from './models';

/**
 * The pause between naming a feeling and being handed advice is the part that
 * does the work, so these come before any suggestion. Open, non-leading, and
 * answerable in one line by someone with very little energy left.
 *
 * Bundled with the build rather than stored per user: they are the same for
 * everyone and need no table (REQ-SEED-07).
 */
export const EQ_EXPLORE_QUESTIONS: ExploreQuestion[] = [
  { id: 'when', text: 'When did this start?' },
  { id: 'underneath', text: "What's underneath this?" },
  { id: 'needed', text: 'What would help right now, even slightly?' }
];
