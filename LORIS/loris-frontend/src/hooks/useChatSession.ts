import { useCallback, useEffect, useState } from 'react';
import { getChatbotReply } from '../group-d/chatbot/chatbotEngine';
import { INSTITUTION } from '../integration/loris';
import type { ChatMessage } from '../types/chat';

const KEY = 'loris:chat-session';
const uid = () => crypto.randomUUID();

function welcome(): ChatMessage {
  return {
    id: uid(),
    role: 'bot',
    botKind: 'welcome',
    at: new Date().toISOString(),
    text:
      `Welcome to the ${INSTITUTION.name} Library Assistant. I am an automated support guide designed to help you ` +
      'discover catalogue resources, configure offline reading, manage your loans, and navigate platform features.\n' +
      'Select a topic from the sidebar or type a query in the field below.',
  };
}

function load(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ChatMessage[];
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch { /* fall through */ }
  return [welcome()];
}

/** Conversation history for the current browser session (cleared when the tab closes). */
export function useChatSession() {
  const [messages, setMessages] = useState<ChatMessage[]>(load);

  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify(messages)); } catch { /* storage unavailable */ }
  }, [messages]);

  const send = useCallback((raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const reply = getChatbotReply(text); // existing rule-based engine
    const now = Date.now();
    setMessages((cur) => [
      ...cur,
      { id: uid(), role: 'user', text, at: new Date(now).toISOString() },
      {
        id: uid(), role: 'bot', text: reply.text, topic: reply.matchedTopic,
        botKind: reply.matchedTopic ? 'matched' : 'handoff',
        at: new Date(now + 400).toISOString(),
      },
    ]);
  }, []);

  const setFeedback = useCallback((id: string, feedback: 'yes' | 'no') => {
    setMessages((cur) => cur.map((m) => (m.id === id ? { ...m, feedback } : m)));
  }, []);

  const clear = useCallback(() => setMessages([welcome()]), []);

  return { messages, send, setFeedback, clear };
}
