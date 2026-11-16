import { StatusBadge, type StatusVariant } from '../shared';
import type { RequestStatus } from '../../types/platform';

const STATUS: Record<RequestStatus, { label: string; variant: StatusVariant }> = {
  pending: { label: 'Pending', variant: 'accent' },
  more_details: { label: 'More details', variant: 'warning' },
  accepted: { label: 'Accepted', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
};

/** Badge for the state of an organisation registration request. */
export function OrganisationStatus({ status, label }: { status: RequestStatus; label?: string }) {
  const { label: defaultLabel, variant } = STATUS[status];
  return <StatusBadge size="sm" label={label ?? defaultLabel} variant={variant} />;
}
