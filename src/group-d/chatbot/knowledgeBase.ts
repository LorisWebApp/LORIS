export interface ChatbotKnowledgeItem {
  id: string;
  keywords: string[];
  answer: string;
  priority?: number;
}

export const chatbotKnowledgeBase: ChatbotKnowledgeItem[] = [
  {
    id: "find-material",
    keywords: ["find a book", "find book", "search book", "find material", "search catalogue", "catalogue"],
    answer: "Open the Catalogue and use the search bar to look for a title, author, subject, or keyword. You can narrow the results using the available category filters.",
    priority: 10,
  },
  {
    id: "save-offline",
    keywords: ["save offline", "download offline", "offline reading", "read offline", "save a book"],
    answer: "Open an authorised material from the Catalogue and choose Save Offline. Once the download finishes, open Offline Library to find it. Offline access is available only until the permission expiry shown by LORIS.",
    priority: 20,
  },
  {
    id: "offline-library",
    keywords: ["offline library", "saved books", "saved materials", "where are my downloads"],
    answer: "Open Offline Library from your account navigation. It lists materials saved on this device, their file sizes, and their offline-access status.",
    priority: 15,
  },
  {
    id: "bookmark",
    keywords: ["bookmark", "bookmarks", "save my place"],
    answer: "While reading a material, use the Bookmark action. Your bookmark is associated with your account and will be queued for synchronisation if you are offline.",
    priority: 10,
  },
  {
    id: "notes",
    keywords: ["add note", "notes", "make a note"],
    answer: "Open the reader and use the Notes feature to add a note. If you are offline, LORIS stores the change locally and attempts to synchronise it when you reconnect.",
    priority: 10,
  },
  {
    id: "highlights",
    keywords: ["highlight", "highlights", "highlight text"],
    answer: "Select the text in the reader and use the Highlight action. Offline changes are queued for synchronisation when your connection returns.",
    priority: 10,
  },
  {
    id: "favourites",
    keywords: ["favourite", "favorites", "favourites", "add to favourites"],
    answer: "Use the Favourite action on a material card or its details page. You can find saved favourites in My Library.",
    priority: 10,
  },
  {
    id: "support",
    keywords: ["support", "help desk", "ticket", "report a problem", "contact support"],
    answer: "Open System Support from your account menu and submit a support ticket with a clear description of the issue. If the issue cannot be resolved by this assistant, contact your organisation administrator.",
    priority: 20,
  },
  {
    id: "password",
    keywords: ["forgot password", "reset password", "change password", "password"],
    answer: "On the sign-in page, select Forgot Password and follow the instructions sent to your registered email address. If you no longer have access to that email, contact your organisation administrator.",
    priority: 15,
  },
  {
    id: "sync",
    keywords: ["sync", "synchronise", "synchronize", "pending changes", "not syncing"],
    answer: "LORIS queues supported offline changes on this device. When you reconnect, open the sync status in Offline Library and try Sync Now. Some changes may require conflict resolution or renewed permission.",
    priority: 15,
  },
];

export const fallbackAnswer =
  "I can help with catalogue searches, offline reading, bookmarks, notes, highlights, favourites, password recovery, synchronisation, and support tickets. Try asking about one of these topics, or open System Support for further assistance.";
