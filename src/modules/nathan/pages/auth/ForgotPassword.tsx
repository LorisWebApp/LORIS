import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button } from '../../components/shared';
import { Input } from '../../components/common/Input';
import { AuthLayout } from '../../components/layouts/AuthLayout';
import { ROUTES } from '../../routes/paths';
import { requestPasswordReset } from '../../services/auth.service';
import { getErrorMessage, isEmail } from '../../utils/validation';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!email.trim()) return setError('Enter your email address.');
    if (!isEmail(email)) return setError('Enter a valid email address.');
    setError(null);

    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setSentTo(email.trim());
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Reset Your Password"
      description="Enter Email Associated with Your Loris Web Library Account"
      footer={<Link to={ROUTES.login} className="font-semibold text-deep underline underline-offset-4">Back to login</Link>}
    >
      {sentTo ? (
        <Alert severity="success" title="Check your inbox">
          If an account exists for {sentTo}, we've sent a link to reset your password. The link may take a few minutes to arrive.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {formError && <Alert severity="error">{formError}</Alert>}
          <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }} error={error ?? undefined} disabled={submitting} />
          <Button type="submit" variant="secondary" loading={submitting}>Send Reset Password Email</Button>
        </form>
      )}
    </AuthLayout>
  );
}
