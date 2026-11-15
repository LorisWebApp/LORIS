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
  status?: OrganisationStatusValue;
  message?: string;
}

/** Figures shown on the Platform Manager overview. Every value comes from the backend. */
export interface PlatformOverview {
  activeEndUsers: number;
  endUsersSignedIn: number;
  activeOrganisations: number;
  organisationsSignedIn: number;
  pendingRequests: number;
  requestsReceivedToday: number;
  openSupportTickets: number;
  ticketsNeedingReply: number;
  materials: { total: number; books: number; videos: number; images: number; audio: number };
  /** `null` until the backend can report storage. */
  storage: { usedBytes: number; totalBytes?: number | null } | null;
}
