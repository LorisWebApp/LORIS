import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Alert, Button, LoadingIndicator } from '../../components/shared';
import { Input } from '../../components/common/Input';
import { AuthLayout } from '../../components/layouts/AuthLayout';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES, homeRouteForRole } from '../../routes/paths';
import { sendVerificationEmail, verifyEmail } from '../../services/auth.service';
import { getErrorMessage, isEmail } from '../../utils/validation';

type TokenState = 'idle' | 'verifying' | 'verified' | 'failed';

/**
 * Two modes:
 *  - /verify-email?token=...  verifies the emailed link automatically.
 *  - /verify-email            lets the user request a (new) verification email.
 */
export function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const routeState = (useLocation().state ?? null) as { email?: string } | null;
  const { user, refresh } = useAuth();

  const [tokenState, setTokenState] = useState<TokenState>(token ? 'verifying' : 'idle');
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [email, setEmail] = useState(routeState?.email ?? user?.email ?? '');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  // Verification tokens are single-use: guard against the StrictMode double effect.
  const attempted = useRef(false);
  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;
    verifyEmail(token)
      .then(async () => { setTokenState('verified'); await refresh(); })
      .catch((err) => { setTokenError(getErrorMessage(err, 'We could not verify your email.')); setTokenState('failed'); });
  }, [token, refresh]);

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!email.trim()) return setFieldError('Enter your email address.');
    if (!isEmail(email)) return setFieldError('Enter a valid email address.');
    setFieldError(null);

    setSubmitting(true);
    try {
      await sendVerificationEmail(email.trim());
      setSentTo(email.trim());
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (tokenState === 'verifying') {
    return <AuthLayout title="Verify Email"><LoadingIndicator centered label="Verifying your email…" /></AuthLayout>;
  }

  if (tokenState === 'verified') {
    return (
      <AuthLayout title="Email verified">
        <Alert severity="success" title="Thank you">Your email address has been verified.</Alert>
        <div className="mt-6 flex justify-center">
          <Button to={user ? homeRouteForRole(user.role) : ROUTES.login} variant="secondary">{user ? 'Continue' : 'Go to login'}</Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Verify Email"
      description="Enter Email Associated with Your Loris Web Library Account"
      footer={<Link to={ROUTES.login} className="font-semibold text-deep underline underline-offset-4">Back to login</Link>}
    >
      {tokenState === 'failed' && (
        <Alert severity="error" title="Verification failed" className="mb-4">{tokenError} Request a new verification email below.</Alert>
      )}
      {sentTo ? (
        <Alert severity="success" title="Verification email sent">
          We've sent a verification link to {sentTo}. Open it to finish verifying your account.
        </Alert>
      ) : (
        <form onSubmit={handleSend} noValidate className="space-y-4">
          {formError && <Alert severity="error">{formError}</Alert>}
          <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setFieldError(null); }} error={fieldError ?? undefined} disabled={submitting} />
          <Button type="submit" variant="secondary" loading={submitting}>Send Verification Email</Button>
        </form>
      )}
    </AuthLayout>
  );
}
