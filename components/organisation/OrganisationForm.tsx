import { useState, type FormEvent } from 'react';
import { Button } from '../shared';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { ORGANISATION_TYPES, type OrganisationRegistrationRequest } from '../../types/organisation';
import { isEmail, type FieldErrors } from '../../utils/validation';

interface OrganisationFormProps {
  submitting: boolean;
  /** Errors returned by the server, keyed by field name. */
  serverErrors?: FieldErrors;
  onSubmit: (values: OrganisationRegistrationRequest) => void;
}

const empty: OrganisationRegistrationRequest = {
  organisationName: '', email: '', organisationType: '', country: '', provinceOrState: '', cityOrTown: '', postalCode: '',
};

export function OrganisationForm({ submitting, serverErrors, onSubmit }: OrganisationFormProps) {
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<FieldErrors>({});
  const shown = { ...serverErrors, ...errors };

  const set = (key: keyof OrganisationRegistrationRequest) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    if (!values.organisationName.trim()) e.organisationName = 'Enter the organisation name.';
    if (!values.email.trim()) e.email = 'Enter an email address.';
    else if (!isEmail(values.email)) e.email = 'Enter a valid email address.';
    if (!values.organisationType) e.organisationType = 'Select an organisation type.';
    if (!values.country.trim()) e.country = 'Enter a country.';
    if (!values.provinceOrState.trim()) e.provinceOrState = 'Enter a province or state.';
    if (!values.cityOrTown.trim()) e.cityOrTown = 'Enter a city or town.';
    if (!values.postalCode.trim()) e.postalCode = 'Enter a postal code.';
    return e;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;
    onSubmit({ ...values, organisationName: values.organisationName.trim(), email: values.email.trim() });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Input label="Organisation Name" autoComplete="organization" value={values.organisationName} onChange={(e) => set('organisationName')(e.target.value)} error={shown.organisationName} disabled={submitting} />
      <Input label="Email" type="email" autoComplete="email" value={values.email} onChange={(e) => set('email')(e.target.value)} error={shown.email} disabled={submitting} />
      <Select label="Organisation Type" options={ORGANISATION_TYPES} value={values.organisationType} onChange={(e) => set('organisationType')(e.target.value)} error={shown.organisationType} disabled={submitting} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Country" autoComplete="country-name" value={values.country} onChange={(e) => set('country')(e.target.value)} error={shown.country} disabled={submitting} />
        <Input label="Province/State" autoComplete="address-level1" value={values.provinceOrState} onChange={(e) => set('provinceOrState')(e.target.value)} error={shown.provinceOrState} disabled={submitting} />
        <Input label="City/Town" autoComplete="address-level2" value={values.cityOrTown} onChange={(e) => set('cityOrTown')(e.target.value)} error={shown.cityOrTown} disabled={submitting} />
        <Input label="Postal Code" autoComplete="postal-code" value={values.postalCode} onChange={(e) => set('postalCode')(e.target.value)} error={shown.postalCode} disabled={submitting} />
      </div>
      <div className="flex justify-center pt-2">
        <Button type="submit" variant="secondary" loading={submitting}>Register</Button>
      </div>
    </form>
  );
}
