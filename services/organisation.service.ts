import type { OrganisationRegistrationRequest, OrganisationRegistrationResponse, PlatformOverview } from '../types/organisation';
import { apiRequest } from './api';

export const organisationService = {
  /** Public request for a new organisation to be reviewed by the Platform Manager. */
  submitRegistrationRequest: (payload: OrganisationRegistrationRequest) =>
    apiRequest<OrganisationRegistrationResponse>('/organisations/registration-requests', { method: 'POST', body: payload }),

  /** Platform Manager overview figures. */
  getPlatformOverview: () => apiRequest<PlatformOverview>('/platform/overview'),
};
