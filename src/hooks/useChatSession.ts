import { useCallback, useEffect, useState } from 'react';
import { getChatbotReply, getDatabaseIntent } from '../group-d/chatbot/chatbotEngine';
import { executeChatbotDataQuery } from '../group-d/chatbot/chatbotData';
import { useNetworkStatus } from '../group-d/hooks/useNetworkStatus';
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
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify(messages)); } catch { /* storage unavailable */ }
  }, [messages]);

  const send = useCallback(async (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const now = Date.now();
    setMessages((cur) => [...cur, { id: uid(), role: 'user', text, at: new Date(now).toISOString() }]);

    const intent = getDatabaseIntent(text);
    let replyText: string;
    let topic: string | null;
    if (intent && !isOnline) {
      replyText = 'That question needs live LORIS data. Please reconnect to the internet and try again. I can still answer general help questions while offline.';
      topic = null;
    } else if (intent) {
      replyText = await executeChatbotDataQuery(intent);
      topic = `database-${intent.type}`;
    } else {
      const reply = getChatbotReply(text);
      replyText = reply.text;
      topic = reply.matchedTopic;
    }

    setMessages((cur) => [...cur, {
      id: uid(), role: 'bot', text: replyText, topic,
      botKind: topic ? 'matched' : 'handoff',
      at: new Date().toISOString(),
    }]);
  }, [isOnline]);

  const setFeedback = useCallback((id: string, feedback: 'yes' | 'no') => {
    setMessages((cur) => cur.map((m) => (m.id === id ? { ...m, feedback } : m)));
  }, []);

  const clear = useCallback(() => setMessages([welcome()]), []);

  return { messages, send, setFeedback, clear };
}
