import type { OrganisationRegistrationRequest, OrganisationRegistrationResponse, RegistrationTracking } from '../types/organisation';
import { apiRequest } from './api';

export const organisationService = {
  /** Public request for a new organisation to be reviewed by the Platform Manager. */
  submitRegistrationRequest: (payload: OrganisationRegistrationRequest) =>
    apiRequest<OrganisationRegistrationResponse>('/organisations/registration-requests', { method: 'POST', body: payload }),

  /** Current state of a registration request, for the organisation's pending page. */
  getRegistrationStatus: (reference: string, token: string, signal?: AbortSignal) =>
    apiRequest<RegistrationTracking>(`/organisations/registration-requests/${encodeURIComponent(reference)}`, { signal, headers: { 'X-Registration-Token': token } }),

  /** The organisation's answer to a "more details" request. Returns the updated request (status goes back to pending). */
  respondToRegistration: (reference: string, token: string, message: string) =>
    apiRequest<RegistrationTracking>(`/organisations/registration-requests/${encodeURIComponent(reference)}/response`, {
      method: 'POST',
      body: { message },
      headers: { 'X-Registration-Token': token },
    }),
};
