import { useState, type FormEvent } from 'react';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Input } from '../../components/common/Input';
import { AuthLayout } from '../../components/layouts/AuthLayout';
import { Alert } from '../../components/shared';
import { ApiError } from '../../services/api';
import { authService } from '../../services/auth.service';
import { ROUTES } from '../../utils/constants';
import { validEmail } from '../../utils/validators';

/** Password reset request: asks the backend to email a reset link. */
export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const problem = validEmail(email);
    setEmailError(problem);
    if (problem) {
      document.getElementById('email')?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const response = await authService.requestPasswordReset({ email: email.trim() });
      setSuccessMessage(response?.message ?? 'Your password reset request has been submitted.');
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const back = (
    <div className="flex flex-wrap gap-2">
      <Button to={ROUTES.organisationLogin} variant="outline" size="sm">
        Organisation Admin login
      </Button>
      <Button to={ROUTES.platformLogin} variant="outline" size="sm">
        Platform Manager login
      </Button>
    </div>
  );

  return (
    <AuthLayout
      title="Reset Your Password"
      description={successMessage ? undefined : 'Enter the email associated with your Loris Web Library account.'}
      footer={back}
    >
      {successMessage ? (
        <Alert severity="success">{successMessage}</Alert>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <ErrorMessage message={formError} />
          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (emailError) setEmailError(undefined);
            }}
            error={emailError}
          />
          <Button type="submit" variant="primary" loading={submitting}>
            Send Reset Password Email
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
