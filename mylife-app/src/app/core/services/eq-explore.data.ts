import { ExploreQuestion } from './models';

/**
 * The pause between naming a feeling and being handed advice is the part that
 * does the work, so these come first. Open, non-leading, and answerable in one
 * line by someone with very little energy left.
 *
 * Three are asked per check-in, chosen from the emotion so different feelings
 * get different questions while one check-in keeps the same three throughout
 * (REQ-EQ-02).
 */
export const EQ_EXPLORE_QUESTIONS: ExploreQuestion[] = [
  { id: "when-did-you-first-notice-it", text: "When did you first notice it?" },
  { id: "what-was-happening-just-before", text: "What was happening just before?" },
  { id: "where-in-your-body-is-it", text: "Where in your body is it?" },
  { id: "what-word-comes-closest", text: "What word comes closest?" },
  { id: "how-strong-is-it-right-now", text: "How strong is it right now?" },
  { id: "what-else-is-in-it", text: "What else is in it?" },
  { id: "what-does-this-remind-you-of", text: "What does this remind you of?" },
  { id: "what-does-this-need", text: "What does this need?" },
  { id: "what-would-you-say-to-a-friend", text: "What would you say to a friend?" },
];
