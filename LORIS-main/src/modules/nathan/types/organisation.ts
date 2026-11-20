export const ORGANISATION_TYPES = [
  'School',
  'University / College',
  'Public library',
  'Non-profit',
  'Company',
  'Other',
] as const;

export type OrganisationType = (typeof ORGANISATION_TYPES)[number];

/** Public request to register an organisation (reviewed before approval). */
export interface OrganisationRegistrationRequest {
  /** Full name of the person who will administer the organisation. */
  fullName: string;
  password: string;
  organisationName: string;
  email: string;
  organisationType: string;
  country: string;
  provinceOrState: string;
  cityOrTown: string;
  postalCode: string;
}
