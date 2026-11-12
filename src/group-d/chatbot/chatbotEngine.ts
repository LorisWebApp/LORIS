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
