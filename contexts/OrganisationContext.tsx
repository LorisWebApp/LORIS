import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';

/** An organisation whose invitation code has been validated during sign-up. */
export interface ValidatedOrganisation {
  id: string;
  name: string;
  code: string;
}

export interface OrganisationContextValue {
  organisation: ValidatedOrganisation | null;
  setOrganisation: (organisation: ValidatedOrganisation) => void;
  clearOrganisation: () => void;
}

const STORAGE_KEY = 'loris.validatedOrganisation';

export const OrganisationContext = createContext<OrganisationContextValue | undefined>(undefined);

function read(): ValidatedOrganisation | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ValidatedOrganisation) : null;
  } catch {
    return null;
  }
}

export function OrganisationProvider({ children }: { children: ReactNode }) {
  const [organisation, setState] = useState<ValidatedOrganisation | null>(read);

  const setOrganisation = useCallback((next: ValidatedOrganisation) => {
    setState(next);
    try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }, []);

  const clearOrganisation = useCallback(() => {
    setState(null);
    try { window.sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  const value = useMemo(() => ({ organisation, setOrganisation, clearOrganisation }), [organisation, setOrganisation, clearOrganisation]);
  return <OrganisationContext.Provider value={value}>{children}</OrganisationContext.Provider>;
}
