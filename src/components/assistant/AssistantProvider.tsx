import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { INSTITUTION } from '../../integration/loris';
import type { ChatMessage } from '../../types/chat';
import { askAssistant, type AssistantOperation } from './assistantApi';

const STORAGE_KEY = 'loris:assistant-widget';
const uid = () => crypto.randomUUID();

interface Stored { sessionId: string; messages: ChatMessage[] }

function welcome(): ChatMessage {
  return {
    id: uid(), role: 'bot', botKind: 'welcome', at: new Date().toISOString(),
    text: `Welcome to the ${INSTITUTION.name} Library Assistant. Ask about finding books, offline reading, bookmarks or your account.`,
  };
}

function load(): Stored {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Stored;
      if (parsed.sessionId && Array.isArray(parsed.messages) && parsed.messages.length) return parsed;
    }
  } catch { /* fall through to a fresh session */ }
  return { sessionId: uid(), messages: [welcome()] };
}

export interface AssistantContextValue {
  open: boolean;
  messages: ChatMessage[];
  loading: boolean;
  openAssistant: () => void;
  /** Collapses to the bubble. The conversation is kept for the session. */
  minimize: () => void;
  send: (text: string, operation?: AssistantOperation) => void;
  setFeedback: (id: string, v: 'yes' | 'no') => void;
  clear: () => void;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

/**
 * Owns the assistant's open state and conversation. Mounted once in the End User
 * layout, so state survives navigation between End User pages.
 */
export function AssistantProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(load);
  const [messages, setMessages] = useState<ChatMessage[]>(initial.messages);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const sessionId = useRef(initial.sessionId);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId: sessionId.current, messages })); } catch { /* storage unavailable */ }
  }, [messages]);

  useEffect(() => () => abort.current?.abort(), []);

  const send = useCallback((raw: string, operation: AssistantOperation = 'faq_lookup') => {
    const text = raw.trim();
    if (!text || abort.current) return; // ignore empty input and double-sends while a reply is pending
    const controller = new AbortController();
    abort.current = controller;
    setLoading(true);
    setMessages((cur) => [...cur, { id: uid(), role: 'user', text, at: new Date().toISOString() }]);

    askAssistant({ operation, query: text, sessionId: sessionId.current }, controller.signal)
      .then((r) => ({ text: r.text, topic: r.matchedTopic, botKind: r.botKind }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return null;
        return { text: 'Sorry, I could not reach the assistant just now. Please try again, or contact the library support desk.', topic: null, botKind: 'handoff' as const };
      })
      .then((reply) => {
        if (!reply) return;
        setMessages((cur) => [...cur, { id: uid(), role: 'bot', at: new Date().toISOString(), ...reply }]);
      })
      .finally(() => {
        if (abort.current === controller) abort.current = null;
        setLoading(false);
      });
  }, []);

  const clear = useCallback(() => {
    abort.current?.abort();
    abort.current = null;
    setLoading(false);
    setMessages([welcome()]);
  }, []);

  const setFeedback = useCallback((id: string, feedback: 'yes' | 'no') => {
    setMessages((cur) => cur.map((m) => (m.id === id ? { ...m, feedback } : m)));
  }, []);

  const value = useMemo<AssistantContextValue>(() => ({
    open, messages, loading, send, clear, setFeedback,
    openAssistant: () => setOpen(true),
    minimize: () => setOpen(false),
  }), [open, messages, loading, send, clear, setFeedback]);

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant(): AssistantContextValue {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error('useAssistant must be used inside <AssistantProvider>');
  return ctx;
}
