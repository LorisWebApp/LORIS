import { useState } from 'react';
import { Alert } from '../../components/shared';
import { Button } from '../../components/common/Button';
import { AuthLayout } from '../../components/layouts/AuthLayout';
import { OrganisationForm } from '../../components/organisation/OrganisationForm';
import type { OrganisationRegistrationResponse } from '../../types/organisation';
import { ROUTES } from '../../utils/constants';

export default function OrganisationRegistration() {
  const [submitted, setSubmitted] = useState<OrganisationRegistrationResponse | null>(null);

  if (submitted) {
    return (
      <AuthLayout title="Request submitted" footer={<Button to={ROUTES.organisationLogin} variant="text">Go to Organisation Admin sign in</Button>}>
        <Alert severity="success">{submitted.message ?? 'Your registration request has been submitted for review.'}</Alert>
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
      <OrganisationForm onSubmitted={setSubmitted} />
    </AuthLayout>
  );
}
