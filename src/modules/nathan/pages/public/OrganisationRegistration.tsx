import { CircleCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button } from '../../components/shared';
import { AuthLayout } from '../../components/layouts/AuthLayout';
import { OrganisationForm } from '../../components/organisation/OrganisationForm';
import { ROUTES } from '../../routes/paths';
import { ApiError } from '../../services/http';
import { submitRegistrationRequest } from '../../services/organisation.service';
import type { OrganisationRegistrationRequest } from '../../types/organisation';
import { getErrorMessage, type FieldErrors } from '../../utils/validation';

/** Public form to request registration of a new organisation. */
export function OrganisationRegistration() {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<FieldErrors>();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  async function handleSubmit(values: OrganisationRegistrationRequest) {
    setSubmitting(true);
    setFormError(null);
    setServerErrors(undefined);
    try {
      await submitRegistrationRequest(values);
      setSubmittedEmail(values.email);
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setServerErrors(err.fieldErrors);
      setFormError(err instanceof ApiError && err.status === 409 ? 'An organisation with these details is already registered or awaiting review.' : getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedEmail) {
    return (
      <AuthLayout title="Request received">
        <div className="flex flex-col items-center text-center">
          <CircleCheck size={32} className="text-brand" aria-hidden />
          <p className="mt-3 text-[16px] leading-6 text-ink/80">
            Thank you. We've received your organisation's registration request and will contact you at {submittedEmail} once it has been reviewed.
          </p>
          <div className="mt-6"><Button to={ROUTES.login} variant="secondary">Back to login</Button></div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Organisational Registration"
      footer={<span>Already registered? <Link to={ROUTES.login} className="font-semibold text-deep underline underline-offset-4">Log in</Link></span>}
    >
      {formError && <Alert severity="error" className="mb-4">{formError}</Alert>}
      <OrganisationForm submitting={submitting} serverErrors={serverErrors} onSubmit={handleSubmit} />
    </AuthLayout>
  );
}
