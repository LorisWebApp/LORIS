import { useState, type FormEvent } from 'react';
import { ApiError } from '../../services/api';
import { organisationService } from '../../services/organisation.service';
import type { OrganisationRegistrationRequest, OrganisationRegistrationResponse } from '../../types/organisation';
import { required, validEmail, validate } from '../../utils/validators';
import { Button } from '../common/Button';
import { ErrorMessage } from '../common/ErrorMessage';
import { Input } from '../common/Input';

type Values = OrganisationRegistrationRequest;
type Errors = Partial<Record<keyof Values, string>>;

const emptyValues: Values = { name: '', email: '', type: '', country: '', provinceOrState: '', cityOrTown: '', postalCode: '' };

/** Field order drives both rendering of errors and which field receives focus first. */
const fieldOrder: Array<keyof Values> = ['name', 'email', 'type', 'country', 'provinceOrState', 'cityOrTown', 'postalCode'];

const rules = {
  name: required('Organisation name'),
  email: validEmail,
  type: required('Organisation type'),
  country: required('Country'),
  provinceOrState: required('Province/State'),
  cityOrTown: required('City/Town'),
  postalCode: required('Postal code'),
};

interface OrganisationFormProps {
  onSubmitted: (response: OrganisationRegistrationResponse) => void;
}

/** Public organisation registration request form. Submits to the backend; never assumes success. */
export function OrganisationForm({ onSubmitted }: OrganisationFormProps) {
  const [values, setValues] = useState<Values>(emptyValues);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof Values) => (event: { target: { value: string } }) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const focusFirstInvalid = (found: Errors) => {
    const first = fieldOrder.find((field) => found[field]);
    if (first) document.getElementById(first)?.focus();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const found = validate(values, rules);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusFirstInvalid(found);
      return;
    }

    setSubmitting(true);
    try {
      const response = await organisationService.submitRegistrationRequest({
        name: values.name.trim(),
        email: values.email.trim(),
        type: values.type.trim(),
        country: values.country.trim(),
        provinceOrState: values.provinceOrState.trim(),
        cityOrTown: values.cityOrTown.trim(),
        postalCode: values.postalCode.trim(),
      });
      onSubmitted(response);
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError('Something went wrong. Please try again.');
      const serverFieldErrors: Errors = {};
      fieldOrder.forEach((field) => {
        if (apiError.fieldErrors[field]) serverFieldErrors[field] = apiError.fieldErrors[field];
      });
      setErrors(serverFieldErrors);
      setFormError(apiError.message);
      focusFirstInvalid(serverFieldErrors);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <ErrorMessage message={formError} />
      <Input id="name" name="name" label="Organisation Name" autoComplete="organization" required value={values.name} onChange={update('name')} error={errors.name} />
      <Input id="email" name="email" type="email" label="Email" autoComplete="email" required value={values.email} onChange={update('email')} error={errors.email} />
      <Input id="type" name="type" label="Organisation Type" required value={values.type} onChange={update('type')} error={errors.type} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input id="country" name="country" label="Country" autoComplete="country-name" required value={values.country} onChange={update('country')} error={errors.country} />
        <Input id="provinceOrState" name="provinceOrState" label="Province/State" autoComplete="address-level1" required value={values.provinceOrState} onChange={update('provinceOrState')} error={errors.provinceOrState} />
        <Input id="cityOrTown" name="cityOrTown" label="City/Town" autoComplete="address-level2" required value={values.cityOrTown} onChange={update('cityOrTown')} error={errors.cityOrTown} />
        <Input id="postalCode" name="postalCode" label="Postal Code" autoComplete="postal-code" required value={values.postalCode} onChange={update('postalCode')} error={errors.postalCode} />
      </div>
      <div className="pt-2">
        <Button type="submit" variant="primary" loading={submitting} fullWidth>
          Register
        </Button>
      </div>
    </form>
  );
}
