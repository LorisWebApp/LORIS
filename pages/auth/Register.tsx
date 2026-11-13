import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button, LoadingIndicator } from '../../components/shared';
import { Input } from '../../components/common/Input';
import { AuthLayout } from '../../components/layouts/AuthLayout';
import { useOrganisation } from '../../hooks/useOrganisation';
import { ROUTES } from '../../routes/paths';
import { registerWithInvitation } from '../../services/auth.service';
import { ApiError } from '../../services/http';
import { validateOrganisationCode } from '../../services/organisation.service';
import { getErrorMessage, isEmail, validateConfirm, validatePassword, type FieldErrors } from '../../utils/validation';

/** Account creation using an organisation invitation code (validated first on /organisation-code). */
export function Register() {
  const [params] = useSearchParams();
  const codeParam = params.get('code')?.trim() ?? '';
  const navigate = useNavigate();
  const { organisation, setOrganisation, clearOrganisation } = useOrganisation();

  // The code is trusted only if the validated organisation in context matches it.
  const matched = organisation && (!codeParam || organisation.code === codeParam) ? organisation : null;
  const [checking, setChecking] = useState(!matched && !!codeParam);
  const [codeError, setCodeError] = useState<string | null>(null);

  const [values, setValues] = useState({ fullName: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Direct visit / refresh with ?code=...: validate it again.
  const checked = useRef(false);
  useEffect(() => {
    if (matched || !codeParam || checked.current) return;
    checked.current = true;
    validateOrganisationCode(codeParam)
      .then((res) => {
        if (res.valid && res.organisation) setOrganisation({ id: res.organisation.id, name: res.organisation.name, code: codeParam });
        else setCodeError('This invitation code is not valid.');
      })
      .catch((err) => setCodeError(getErrorMessage(err, 'We could not check your invitation code.')))
      .finally(() => setChecking(false));
  }, [matched, codeParam, setOrganisation]);

  if (!matched && !codeParam) return <Navigate to={ROUTES.organisationCode} replace />;

  if (checking) {
    return <AuthLayout title="Create your account"><LoadingIndicator centered label="Checking your invitation code…" /></AuthLayout>;
  }

  if (!matched) {
    return (
      <AuthLayout title="Create your account" footer={<Link to={ROUTES.organisationCode} className="font-semibold text-deep underline underline-offset-4">Enter a different code</Link>}>
        <Alert severity="error" title="Invitation code problem">{codeError ?? 'This invitation code is not valid.'}</Alert>
      </AuthLayout>
    );
  }

  const update = (key: keyof typeof values) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!matched) return;
    const found: FieldErrors = {};
    if (!values.fullName.trim()) found.fullName = 'Enter your full name.';
    if (!values.email.trim()) found.email = 'Enter your email address.';
    else if (!isEmail(values.email)) found.email = 'Enter a valid email address.';
    const pw = validatePassword(values.password);
    if (pw) found.password = pw;
    const cf = validateConfirm(values.password, values.confirm);
    if (cf) found.confirm = cf;
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await registerWithInvitation({ invitationCode: matched.code, fullName: values.fullName.trim(), email: values.email.trim(), password: values.password });
      clearOrganisation();
      navigate(ROUTES.verifyEmail, { replace: true, state: { email: values.email.trim() } });
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setErrors(err.fieldErrors);
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      description={`You're joining ${matched.name}.`}
      footer={<span>Already have an account? <Link to={ROUTES.login} className="font-semibold text-deep underline underline-offset-4">Log in</Link></span>}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <Alert severity="error">{formError}</Alert>}
        <Input label="Full Name" autoComplete="name" value={values.fullName} onChange={(e) => update('fullName')(e.target.value)} error={errors.fullName} disabled={submitting} />
        <Input label="Email" type="email" autoComplete="email" value={values.email} onChange={(e) => update('email')(e.target.value)} error={errors.email} disabled={submitting} />
        <Input label="Enter Password" type="password" autoComplete="new-password" hint="At least 8 characters, with a letter and a number." value={values.password} onChange={(e) => update('password')(e.target.value)} error={errors.password} disabled={submitting} />
        <Input label="Confirm Password" type="password" autoComplete="new-password" value={values.confirm} onChange={(e) => update('confirm')(e.target.value)} error={errors.confirm} disabled={submitting} />
        <div className="flex justify-center pt-2">
          <Button type="submit" variant="secondary" loading={submitting}>Register</Button>
        </div>
      </form>
    </AuthLayout>
  );
}
