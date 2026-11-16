import { StatusBadge, type StatusVariant } from '../shared';
import type { RequestStatus } from '../../types/platform';

const META: Record<RequestStatus, { label: string; variant: StatusVariant }> = {
  pending: { label: 'Pending', variant: 'accent' },
  more_details: { label: 'More details', variant: 'info' },
  accepted: { label: 'Accepted', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
};

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  pending: 'Pending', more_details: 'More details', accepted: 'Accepted', rejected: 'Rejected',
};

export function RequestStatusBadge({ status, label }: { status: RequestStatus; label?: string }) {
  const m = META[status];
  return <StatusBadge label={label ?? m.label} variant={m.variant} size="sm" />;
}
