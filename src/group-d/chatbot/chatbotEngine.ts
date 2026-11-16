import { chatbotKnowledgeBase, fallbackAnswer } from "./knowledgeBase";
import type { ChatbotDataIntent } from "./chatbotData";

export interface ChatbotReply {
  text: string;
  matchedTopic: string | null;
  automated: true;
}

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

/** Recognises only explicitly supported read-only database operations. */
export function getDatabaseIntent(message: string): ChatbotDataIntent | null {
  const query = normalise(message);
  if (!query) return null;

  if (/\b(categories|category|catalogue categories)\b/.test(query) && /\b(show|list|what|which|available|all|view)\b/.test(query)) {
    return { type: "categories" };
  }
  if (/\b(bookmarks|bookmark)\b/.test(query) && /\b(my|show|list|view|what|where)\b/.test(query)) return { type: "bookmarks" };
  if (/\b(notes|note)\b/.test(query) && /\b(my|show|list|view|what|find)\b/.test(query)) return { type: "notes" };
  if (/\b(highlights|highlight)\b/.test(query) && /\b(my|show|list|view|what)\b/.test(query)) return { type: "highlights" };
  if (/\b(favourites|favorites|favourite|favorite)\b/.test(query) && /\b(my|show|list|view|what)\b/.test(query)) return { type: "favourites" };
  if (/\b(reading progress|progress|currently reading|books? (?:i am|i'm) reading)\b/.test(query) && /\b(my|show|list|view|what|how)\b/.test(query)) return { type: "reading_progress" };
  if (/\b(offline downloads|downloads|saved offline|downloaded materials)\b/.test(query) && /\b(my|show|list|view|what|where)\b/.test(query)) return { type: "offline_downloads" };

  const materialQuestion = /\b(materials?|books?|resources?)\b/.test(query) && /\b(find|search|show|list|available|how many|count|number|look for)\b/.test(query);
  if (materialQuestion) {
    const count = /\b(how many|count|number of)\b/.test(query);
    const term = query
      .replace(/\b(find|search|show|list|available|how many|count|number|of|look|for|me|the|a|an|all|materials?|books?|resources?|are|there|is|in|on|about|related|to|catalogue|catalog)\b/g, " ")
      .replace(/\s+/g, " ").trim();
    return count ? { type: "count_materials", term } : { type: "search_materials", term };
  }
  return null;
}

export function getChatbotReply(message: string): ChatbotReply {
  const query = normalise(message);
  if (!query) return { text: "Please type a question so I can try to help.", matchedTopic: null, automated: true };

  const matches = chatbotKnowledgeBase
    .map((item) => {
      const score = item.keywords.reduce((total, keyword) => {
        const normalisedKeyword = normalise(keyword);
        return total + (query.includes(normalisedKeyword) ? normalisedKeyword.split(" ").length : 0);
      }, 0);
      return { item, score };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || (b.item.priority ?? 0) - (a.item.priority ?? 0));

  if (!matches.length) return { text: fallbackAnswer, matchedTopic: null, automated: true };
  return { text: matches[0].item.answer, matchedTopic: matches[0].item.id, automated: true };
}

import { chatbotKnowledgeBase, fallbackAnswer } from "./knowledgeBase";

export interface ChatbotReply {
  text: string;
  matchedTopic: string | null;
  automated: true;
}

function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getChatbotReply(message: string): ChatbotReply {
  const query = normalise(message);

  if (!query) {
    return {
      text: "Please type a question so I can try to help.",
      matchedTopic: null,
      automated: true,
    };
  }

  const matches = chatbotKnowledgeBase
    .map((item) => {
      const score = item.keywords.reduce((total, keyword) => {
        const normalisedKeyword = normalise(keyword);
        return total + (query.includes(normalisedKeyword) ? normalisedKeyword.split(" ").length : 0);
      }, 0);

      return { item, score };
    })
    .filter((match) => match.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.item.priority ?? 0) - (a.item.priority ?? 0)
    );

  if (matches.length === 0) {
    return { text: fallbackAnswer, matchedTopic: null, automated: true };
  }

  return {
    text: matches[0].item.answer,
    matchedTopic: matches[0].item.id,
    automated: true,
  };
}
