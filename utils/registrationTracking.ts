const key = (reference: string) => `loris.registration.${reference}`;

/** Remembers the secret for a registration request in this browser so the pending page survives a reload. */
export function saveTrackingToken(reference: string, token: string): void {
  try {
    localStorage.setItem(key(reference), token);
  } catch {
    /* storage unavailable: the emailed link still works */
  }
}

export function loadTrackingToken(reference: string): string | null {
  try {
    return localStorage.getItem(key(reference));
  } catch {
    return null;
  }
}
