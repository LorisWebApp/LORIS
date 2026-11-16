import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../../components/shared';
import { Button } from '../../components/common/Button';
import { AuthLayout } from '../../components/layouts/AuthLayout';
import { OrganisationForm } from '../../components/organisation/OrganisationForm';
import type { OrganisationRegistrationResponse } from '../../types/organisation';
import { ROUTES } from '../../utils/constants';
import { saveTrackingToken } from '../../utils/registrationTracking';

export default function OrganisationRegistration() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState<OrganisationRegistrationResponse | null>(null);

  /** Go to the pending page when the backend gave us a way to track the request; otherwise just confirm. */
  const handleSubmitted = (response: OrganisationRegistrationResponse) => {
    if (response.reference && response.trackingToken) {
      saveTrackingToken(response.reference, response.trackingToken);
      navigate(ROUTES.registrationPending(response.reference), { replace: true });
      return;
    }
    setSubmitted(response);
  };

  if (submitted) {
    return (
      <AuthLayout title="Request submitted" footer={<Button to={ROUTES.organisationLogin} variant="text">Go to Organisation Admin sign in</Button>}>
        <div className="space-y-3">
          <Alert severity="success">{submitted.message ?? 'Your registration request has been submitted to the Platform Manager for review.'}</Alert>
          {submitted.reference && <p className="text-[15px] text-ink/80">Your reference: <span className="font-semibold text-deep">{submitted.reference}</span></p>}
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Organisational Registration"
      footer={
        <>
          Already registered?{' '}
          <Button to={ROUTES.organisationLogin} variant="text" size="sm">
            Organisation Admin sign in
          </Button>
        </>
      }
    >
      <OrganisationForm onSubmitted={handleSubmitted} />
    </AuthLayout>
  );
}
