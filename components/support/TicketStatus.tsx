import { StatusBadge, type StatusVariant } from '../shared';
import type { Ticket } from '../../types/ticket';

/** Badge for a support ticket. `perspective` decides whose reply the ticket is waiting for. */
export function TicketStatus({ ticket, perspective }: { ticket: Pick<Ticket, 'status' | 'awaitingReply'>; perspective: 'admin' | 'organisation' }) {
  let label: string;
  let variant: StatusVariant;
  if (ticket.status === 'resolved') {
    label = 'Resolved';
    variant = 'success';
  } else if (ticket.awaitingReply) {
    label = perspective === 'admin' ? 'Awaiting your reply' : 'Awaiting reply';
    variant = 'accent';
  } else {
    label = 'Open';
    variant = 'info';
  }
  return <StatusBadge size="sm" label={label} variant={variant} />;
}
