export type OrganisationStatusValue = 'pending' | 'approved' | 'rejected' | 'suspended' | 'expired';

/** Payload for a public organisation registration request. */
export interface OrganisationRegistrationRequest {
  name: string;
  email: string;
  type: string;
  country: string;
  provinceOrState: string;
  cityOrTown: string;
  postalCode: string;
}

export interface OrganisationRegistrationResponse {
  id?: string;
  /** Reference the organisation can quote, e.g. when the Platform Manager asks for more details. */
  reference?: string;
  /** Secret that lets the submitting organisation view and answer this request without an account. */
  trackingToken?: string;
  status?: OrganisationStatusValue;
  message?: string;
}

export type RegistrationProgress = 'pending' | 'more_details' | 'accepted' | 'rejected';

/** One message in the conversation between the Platform Manager and the organisation. */
export interface RegistrationMessage {
  id: string;
  from: 'platform' | 'organisation';
  message: string;
  at: string;
}

/** What the organisation sees on its registration pending page. */
export interface RegistrationTracking {
  reference: string;
  status: RegistrationProgress;
  submittedAt: string;
  organisationName: string;
  email: string;
  organisationType: string;
  country: string;
  provinceOrState: string;
  cityOrTown: string;
  postalCode: string;
  /** Oldest first. Includes the Platform Manager's questions, the organisation's replies and any rejection reason. */
  thread: RegistrationMessage[];
}

export type AccessAction = 'suspend' | 'restore';

export interface OrganisationAccess {
  id: string;
  name: string;
  members: number;
  /** ISO date when access ends, if limited. */
  accessEndsAt?: string | null;
  status: 'active' | 'suspended';
}

export type RenewalStatus = 'pending' | 'approved' | 'declined';
export type RenewalDecision = 'approve' | 'decline';

export interface PlatformRenewal {
  id: string;
  reference: string;
  organisationName: string;
  termMonths: number;
  note?: string | null;
  status: RenewalStatus;
  submittedAt: string;
  decidedAt?: string | null;
}

export interface RenewalPage {
  items: PlatformRenewal[];
  total: number;
  counts: Record<RenewalStatus, number>;
}
