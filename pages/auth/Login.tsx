import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button } from '../../components/shared';
import { Input } from '../../components/common/Input';
import { AuthLayout } from '../../components/layouts/AuthLayout';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES, homeRouteForRole } from '../../routes/paths';
import { ApiError } from '../../services/http';
import { isEmail, type FieldErrors } from '../../utils/validation';

interface LocationState {
  from?: { pathname: string; search?: string };
  notice?: string;
  email?: string;
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const state = (useLocation().state ?? null) as LocationState | null;

  const [values, setValues] = useState({ organisationName: '', email: state?.email ?? '', password: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof typeof values) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found: FieldErrors = {};
    if (!values.organisationName.trim()) found.organisationName = 'Enter your organisation name.';
    if (!values.email.trim()) found.email = 'Enter your email address.';
    else if (!isEmail(values.email)) found.email = 'Enter a valid email address.';
    if (!values.password) found.password = 'Enter your password.';
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const user = await login({ organisationName: values.organisationName.trim(), email: values.email.trim(), password: values.password });
      if (!user.emailVerified) {
        navigate(ROUTES.verifyEmail, { replace: true, state: { email: user.email } });
        return;
      }
      const from = state?.from;
      navigate(from ? `${from.pathname}${from.search ?? ''}` : homeRouteForRole(user.role), { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'EMAIL_NOT_VERIFIED') {
          navigate(ROUTES.verifyEmail, { replace: true, state: { email: values.email.trim() } });
          return;
        }
        if (err.fieldErrors) setErrors(err.fieldErrors);
        setFormError(err.status === 401 ? 'Incorrect organisation, email or password.' : err.message);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Organisational Login"
      footer={
        <p className="space-x-1">
          <span>New here?</span>
          <Link to={ROUTES.organisationCode} className="font-semibold text-deep underline underline-offset-4">Join with an invitation code</Link>
          <span>or</span>
          <Link to={ROUTES.organisationRegistration} className="font-semibold text-deep underline underline-offset-4">register your organisation</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {state?.notice && <Alert severity="success">{state.notice}</Alert>}
        {formError && <Alert severity="error">{formError}</Alert>}

        <Input label="Organisation Name" autoComplete="organization" value={values.organisationName} onChange={(e) => update('organisationName')(e.target.value)} error={errors.organisationName} disabled={submitting} />
        <Input label="Email" type="email" autoComplete="email" value={values.email} onChange={(e) => update('email')(e.target.value)} error={errors.email} disabled={submitting} />
        <Input label="Organisation Password" type="password" autoComplete="current-password" value={values.password} onChange={(e) => update('password')(e.target.value)} error={errors.password} disabled={submitting} />

        <Link to={ROUTES.forgotPassword} className="inline-block text-[15px] text-ink underline-offset-4 hover:underline">Forgot Password?</Link>

        <div className="flex justify-center pt-2">
          <Button type="submit" variant="secondary" loading={submitting}>Login</Button>
        </div>
      </form>
    </AuthLayout>
  );
}
