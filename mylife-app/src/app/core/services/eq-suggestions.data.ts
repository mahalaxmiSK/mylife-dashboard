import { EqSuggestion } from './models';

/**
 * Reference data bundled with the app. These never change per user, so they
 * ship in the build rather than being stored in the local database.
 */
export const EQ_SUGGESTIONS: EqSuggestion[] = [
  { id: 'anxious-1', emotion: 'anxious', activity_text: 'Try a 5-minute box breathing exercise' },
  { id: 'anxious-2', emotion: 'anxious', activity_text: 'Write down what you\'re afraid of, then what\'s most likely to happen' },
  { id: 'anxious-3', emotion: 'anxious', activity_text: 'Go for a 10-minute walk without your phone' },
  { id: 'overwhelmed-1', emotion: 'overwhelmed', activity_text: 'Pick ONE thing to do and ignore the rest for now' },
  { id: 'overwhelmed-2', emotion: 'overwhelmed', activity_text: 'Write a brain dump — everything in your head, onto paper' },
  { id: 'overwhelmed-3', emotion: 'overwhelmed', activity_text: 'Take a 20-minute break completely away from screens' },
  { id: 'sad-1', emotion: 'sad', activity_text: 'Call or message someone you feel safe with' },
  { id: 'sad-2', emotion: 'sad', activity_text: 'Put on a comfort playlist and let yourself feel it' },
  { id: 'sad-3', emotion: 'sad', activity_text: 'Do something small and physical — tidy one corner, stretch, cook' },
  { id: 'angry-1', emotion: 'angry', activity_text: 'Write a letter you won\'t send' },
  { id: 'angry-2', emotion: 'angry', activity_text: 'Do something physical — run, dance, punch a pillow' },
  { id: 'angry-3', emotion: 'angry', activity_text: 'Give yourself 10 minutes before responding to the trigger' },
  { id: 'numb-1', emotion: 'numb', activity_text: 'Go outside and notice 5 things you can see, 4 you can touch' },
  { id: 'numb-2', emotion: 'numb', activity_text: 'Make a warm drink and sit with it slowly' },
  { id: 'numb-3', emotion: 'numb', activity_text: 'Watch or read something that usually moves you' },
  { id: 'hopeful-1', emotion: 'hopeful', activity_text: 'Write down three things you\'re looking forward to' },
  { id: 'hopeful-2', emotion: 'hopeful', activity_text: 'Share your hope with someone — it gets stronger out loud' },
  { id: 'hopeful-3', emotion: 'hopeful', activity_text: 'Take one small step toward whatever you\'re hopeful about' },
  { id: 'grateful-1', emotion: 'grateful', activity_text: 'Write three specific things you\'re grateful for today' },
  { id: 'grateful-2', emotion: 'grateful', activity_text: 'Tell one person why you appreciate them' },
  { id: 'grateful-3', emotion: 'grateful', activity_text: 'Look back at how far you\'ve come this year' },
  { id: 'lonely-1', emotion: 'lonely', activity_text: 'Message someone you have not spoken to in a while' },
  { id: 'lonely-2', emotion: 'lonely', activity_text: 'Work somewhere with other people around — a cafe or library' },
  { id: 'lonely-3', emotion: 'lonely', activity_text: 'Do something kind for someone, however small' },
  { id: 'stuck-1', emotion: 'stuck', activity_text: 'Change your physical location, even one room over' },
  { id: 'stuck-2', emotion: 'stuck', activity_text: 'Explain the problem out loud as if to a friend' },
  { id: 'stuck-3', emotion: 'stuck', activity_text: 'Do the smallest possible version of the task for 5 minutes' },
  { id: 'excited-1', emotion: 'excited', activity_text: 'Channel it — start the thing while the energy is high' },
  { id: 'excited-2', emotion: 'excited', activity_text: 'Tell someone who will be excited with you' },
  { id: 'excited-3', emotion: 'excited', activity_text: 'Write down what this feels like, to read on a flat day' },
];
