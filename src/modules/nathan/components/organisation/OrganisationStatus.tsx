import { RequestStatusBadge } from './RequestStatusBadge';

export function OrganisationStatus({ status, label }: { status: string; label?: string }) {
  return <RequestStatusBadge status={status} label={label} />;
}
