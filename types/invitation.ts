/** Result of validating an organisation invitation code. */
export interface InvitationCodeValidation {
  valid: boolean;
  organisation?: { id: string; name: string };
  /** Optional ISO date the code expires. */
  expiresAt?: string;
}
