export type SupportStatus = "open" | "in_progress" | "resolved";
export type SupportCategory =
  | "technical"
  | "account"
  | "reading"
  | "content"
  | "feedback"
  | "other";

export interface SupportResponse {
  id: string;
  author: "You" | "Support team";
  message: string;
  createdAt: string;
}

export interface SupportRequest {
  id: string;
  /** Human-readable reference shown to the user, e.g. SR-1042. */
  reference: string;
  subject: string;
  category: SupportCategory;
  description: string;
  status: SupportStatus;
  createdAt: string;
  updatedAt: string;
  responses: SupportResponse[];
}

export interface NewSupportRequest {
  subject: string;
  category: SupportCategory;
  description: string;
}

export const SUPPORT_CATEGORIES: { value: SupportCategory; label: string }[] = [
  { value: "technical", label: "Technical issue" },
  { value: "account", label: "Account & access" },
  { value: "reading", label: "Reading & offline" },
  { value: "content", label: "Content or material" },
  { value: "feedback", label: "Feedback & suggestions" },
  { value: "other", label: "Other" },
];

export const SUPPORT_STATUS_LABEL: Record<SupportStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
};
