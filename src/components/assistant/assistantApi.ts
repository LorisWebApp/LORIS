/**
 * Transport layer for the floating Library Assistant.
 *
 * The UI only ever talks to `askAssistant()`. Today that resolves against the
 * existing rule-based engine (mock). To connect the Node.js/Express AI service,
 * set VITE_ASSISTANT_API_URL – requests are then POSTed to
 * `${VITE_ASSISTANT_API_URL}/assistant/query` with a predefined `operation`.
 * No component needs to change.
 */
import { getChatbotReply } from '../../group-d/chatbot/chatbotEngine';
import { getAccessToken } from '../../integration/loris';
import type { BotKind } from '../../types/chat';

/** Predefined query operations the backend is expected to implement. */
export type AssistantOperation =
  /** Free-text question answered from library documentation. */
  | 'faq_lookup'
  /** A suggested-topic chip was selected (maps to a curated answer). */
  | 'suggested_topic';

export interface AssistantRequest {
  operation: AssistantOperation;
  query: string;
  /** Stable id for the browser session so the server can correlate turns. */
  sessionId: string;
}

export interface AssistantResponse {
  text: string;
  /** Knowledge-base topic id, or null when nothing matched. */
  matchedTopic: string | null;
  botKind: Exclude<BotKind, 'welcome'>;
}

const API_BASE = (import.meta.env.VITE_ASSISTANT_API_URL as string | undefined)?.replace(/\/$/, '');
const MOCK_LATENCY_MS = 700;

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const id = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { clearTimeout(id); reject(new DOMException('Aborted', 'AbortError')); });
  });

async function mockAssistant(req: AssistantRequest, signal?: AbortSignal): Promise<AssistantResponse> {
  await sleep(MOCK_LATENCY_MS, signal);
  const reply = getChatbotReply(req.query);
  return { text: reply.text, matchedTopic: reply.matchedTopic, botKind: reply.matchedTopic ? 'matched' : 'handoff' };
}

async function httpAssistant(base: string, req: AssistantRequest, signal?: AbortSignal): Promise<AssistantResponse> {
  const token = await getAccessToken();
  const res = await fetch(`${base}/assistant/query`, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Assistant request failed (${res.status})`);
  return (await res.json()) as AssistantResponse;
}

export function askAssistant(req: AssistantRequest, signal?: AbortSignal): Promise<AssistantResponse> {
  return API_BASE ? httpAssistant(API_BASE, req, signal) : mockAssistant(req, signal);
}
