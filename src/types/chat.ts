export type ChatRole = 'user' | 'bot';
/** welcome = static greeting; matched = knowledge-base hit; handoff = no match → human support. */
export type BotKind = 'welcome' | 'matched' | 'handoff';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  /** ISO timestamp. */
  at: string;
  botKind?: BotKind;
  /** Knowledge-base topic id returned by the engine, if any. */
  topic?: string | null;
  feedback?: 'yes' | 'no';
}

export const SUGGESTED_TOPICS: { question: string; chip: string }[] = [
  { question: 'How do I find a book?', chip: 'Find a book' },
  { question: 'How do I save a book for offline reading?', chip: 'Offline reading?' },
  { question: 'How do I add a bookmark?', chip: 'Add bookmark' },
  { question: 'How do I access my favourites?', chip: 'Favourites' },
  { question: 'How do I submit a support ticket?', chip: 'Support ticket' },
  { question: 'How do I reset my password?', chip: 'Reset password' },
];
