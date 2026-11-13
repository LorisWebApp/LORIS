import { useContext } from 'react';
import { OrganisationContext, type OrganisationContextValue } from '../contexts/OrganisationContext';

export function useOrganisation(): OrganisationContextValue {
  const ctx = useContext(OrganisationContext);
  if (!ctx) throw new Error('useOrganisation must be used inside <OrganisationProvider>.');
  return ctx;
}
