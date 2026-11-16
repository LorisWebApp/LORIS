export type TicketPriority = 'high' | 'normal' | 'low';
export type TicketFilter = 'open' | 'awaiting_reply' | 'resolved';

export interface TicketMessage {
  id: string;
  authorType: 'admin' | 'organisation';
  author: string;
  body: string;
  sentAt: string;
  attachment?: { name: string; sizeKb: number } | null;
}

export interface Ticket {
  id: string;
  reference: string;
  subject: string;
  organisationName: string;
  contactEmail: string;
  priority: TicketPriority;
  assignee: string;
  receivedAt: string;
  status: 'open' | 'resolved';
  /** True when the last message came from the organisation and is waiting for an admin reply. */
  awaitingReply?: boolean;
  messages: TicketMessage[];
}

export interface TicketPage {
  items: Ticket[];
  total: number;
  counts: Record<TicketFilter, number>;
}
