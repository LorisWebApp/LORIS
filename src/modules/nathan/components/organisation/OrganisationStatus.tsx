import { RequestStatusBadge } from './RequestStatusBadge';
import type { RequestStatus } from '../../types/platform';

export function OrganisationStatus({ status, label }: { status: RequestStatus; label?: string }) {
  return <RequestStatusBadge status={status} label={label} />;
}
